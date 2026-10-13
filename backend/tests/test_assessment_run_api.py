"""On-demand analysis: POST /api/v1/assessments/{id}/run.

Exercises the real pipeline wiring (extract -> assess -> gate -> script
-> persist -> sync_links) with the LLM boundary faked via monkeypatch
only — no network. Asserts persisted risk + assurance records, 404 for
missing requirements, and 503/500 with rollback on provider/runtime
failures. Re-running supersedes the prior current analysis.
"""

import hashlib
from uuid import UUID

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.assurance_decision import AssuranceDecision
from app.models.enums import RequirementStatus
from app.models.evidence import (
    DetectabilityEvidence,
    EvidenceRecord,
    ProbabilityEvidence,
    SeverityEvidence,
)
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.token_usage import TokenUsage
from app.models.trace_link import TraceLink
from app.services.assessment import assess_evidence


def make_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _seed_requirement(session, key="LIMS-010", text="The system shall lock accounts."):
    req = Requirement(
        title="Lockout requirement",
        description=text,
        req_key=key,
        status=RequirementStatus.DRAFT,
        created_by="t",
    )
    session.add(req)
    session.flush()
    version = RequirementVersion(
        requirement_id=req.id,
        version_number=1,
        text=text,
        hash_sha256=hashlib.sha256(text.encode()).hexdigest(),
        is_current=True,
    )
    session.add(version)
    session.flush()
    req.current_version_id = version.id
    session.flush()
    session.commit()
    return req, version


def _bool(value, conf=0.9):
    return {"value": value, "confidence": conf, "evidence": f"evidence for {value}"}


def _level(value, conf=0.8):
    return {"value": value, "confidence": conf, "evidence": f"evidence for {value}"}


def fake_record_scripted():
    """Deterministic record: patient_safety flag -> severity floor -> scripted."""
    return EvidenceRecord(
        gamp_category=5,
        gamp_reason="Custom access-control logic.",
        severity=SeverityEvidence(
            patient_safety=_bool(True),
            product_quality=_bool(False),
            batch_release=_bool(False),
            data_integrity=_bool(True),
            regulatory_compliance=_bool(True),
            business_continuity=_bool(False),
        ),
        probability=ProbabilityEvidence(
            functional_complexity=_level("HIGH"),
            dependency_complexity=_level("MEDIUM"),
            workflow_complexity=_level("LOW"),
        ),
        detectability=DetectabilityEvidence(
            detection_controls=_level("LOW"),
            traceability=_level("MEDIUM"),
            failure_visibility=_level("LOW"),
        ),
    )


def fake_record_unscripted():
    """Deterministic record: no flags, low complexity, visible -> unscripted."""
    return EvidenceRecord(
        gamp_category=1,
        gamp_reason="Off-the-shelf report viewer.",
        severity=SeverityEvidence(
            patient_safety=_bool(False),
            product_quality=_bool(False),
            batch_release=_bool(False),
            data_integrity=_bool(False),
            regulatory_compliance=_bool(False),
            business_continuity=_bool(False),
        ),
        probability=ProbabilityEvidence(
            functional_complexity=_level("LOW"),
            dependency_complexity=_level("LOW"),
            workflow_complexity=_level("LOW"),
        ),
        detectability=DetectabilityEvidence(
            detection_controls=_level("HIGH"),
            traceability=_level("HIGH"),
            failure_visibility=_level("HIGH"),
        ),
    )


def _fake_script():
    from app.models.models import TestScript as ScriptModel
    from app.models.models import TestStep

    return ScriptModel(
        preconditions="User account exists and is active.",
        steps=[
            TestStep(
                step_number=1,
                action="Enter wrong password five times.",
                expected_result="The account is locked.",
            )
        ],
    )


def _client(monkeypatch, session):
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-ci-only")
    from fastapi.testclient import TestClient

    from app.db.session import get_db
    from app.main import app

    def override_db():
        yield session

    app.dependency_overrides[get_db] = override_db
    return app, TestClient(app), get_db


def _patch(monkeypatch, record, script=None):
    import app.api.v1.endpoints.assessments as endpoint

    monkeypatch.setattr(endpoint, "extract_evidence", lambda text: record)
    if script is not None:
        monkeypatch.setattr(
            endpoint, "generate_test_script", lambda text, assurance: script
        )


class TestRunAssessment:
    def test_run_persists_risk_and_assurance_with_script(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        req, version = _seed_requirement(session)
        record = fake_record_scripted()
        expected = assess_evidence(record)

        def fake_extract(text, usage_log=None):
            usage_log.append(
                {
                    "input_tokens": 4,
                    "output_tokens": 2,
                    "total_tokens": 6,
                    "group": "SeverityEvidence",
                    "model": "test",
                    "attempt": 1,
                    "ok": True,
                }
            )
            return record

        def fake_generate(text, assurance, usage_log=None):
            usage_log.append(
                {
                    "input_tokens": 3,
                    "output_tokens": 1,
                    "total_tokens": 4,
                    "group": "ScriptSteps",
                    "model": "test",
                    "attempt": 1,
                    "ok": True,
                }
            )
            return _fake_script()

        monkeypatch.setattr(endpoint, "extract_evidence", fake_extract)
        monkeypatch.setattr(
            endpoint, "generate_test_script", fake_generate
        )
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert resp.status_code == 201, resp.text
                body = resp.json()
                assert body["requirement_key"] == req.req_key
                assert body["requirement_version_id"] == str(version.id)
                assert body["version"] == 1

                risk = body["risk_assessment"]
                assert risk["rpn"] == expected["rpn"]
                assert risk["band"] == expected["band"].upper()
                assert risk["is_current"] is True
                assert risk["freshness"] == "fresh"
                assert risk["severity"] == expected["severity"]["score"]

                decision = body["assurance_decision"]
                assert decision is not None
                assert decision["assurance_level"] == expected["assurance"][
                    "assurance_level"
                ].upper()
                assert decision["generate_test"] is True
                assert decision["rule_id"] == expected["assurance"]["rule_id"]

                assert body["test_script"] is None
                assert body["token_usage"] == {
                    "run_count": 1,
                    "input_tokens": 4,
                    "output_tokens": 2,
                    "total_tokens": 6,
                }

                # Persisted rows match the response.
                stored = session.get(RiskAssessment, UUID(risk["id"]))
                assert stored is not None
                assert stored.requirement_version_id == version.id
                assert stored.is_current is True
                stored_decision = (
                    session.query(AssuranceDecision)
                    .filter(AssuranceDecision.risk_assessment_id == stored.id)
                    .one()
                )
                assert str(stored_decision.id) == decision["id"]
                assert (
                    session.query(TestScript)
                    .filter(TestScript.assurance_decision_id == stored_decision.id)
                    .count()
                    == 0
                )
                usage = (
                    session.query(TokenUsage)
                    .filter(
                        TokenUsage.requirement_version_id == version.id,
                        TokenUsage.status == "SUCCEEDED",
                    )
                    .one()
                )
                assert usage.extraction_input_tokens == 4
                assert usage.script_output_tokens == 0
                assert usage.total_tokens == 6
                requirement_response = http.get(
                    f"/api/v1/requirements/{req.req_key}"
                )
                assert requirement_response.status_code == 200
                assert requirement_response.json()["token_usage"] == {
                    "run_count": 1,
                    "input_tokens": 4,
                    "output_tokens": 2,
                    "total_tokens": 6,
                }

                # Traceability synchronised in the same transaction.
                links = session.query(TraceLink).all()
                assert {link.link_type for link in links} >= {
                    "has_risk",
                    "assessed_as",
                }
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_script_is_generated_only_after_separate_request(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        req, version = _seed_requirement(session, key="LIMS-015")
        record = fake_record_scripted()
        extract_calls = []
        script_calls = []

        def fake_extract(text, usage_log=None):
            extract_calls.append(text)
            usage_log.append(
                {
                    "input_tokens": 5,
                    "output_tokens": 2,
                    "total_tokens": 7,
                    "group": "SeverityEvidence",
                    "model": "test",
                    "attempt": 1,
                    "ok": True,
                }
            )
            return record

        def fake_script(text, assurance, usage_log=None):
            script_calls.append(assurance)
            usage_log.append(
                {
                    "input_tokens": 3,
                    "output_tokens": 1,
                    "total_tokens": 4,
                    "group": "ScriptSteps",
                    "model": "test",
                    "attempt": 1,
                    "ok": True,
                }
            )
            return _fake_script()

        monkeypatch.setattr(endpoint, "extract_evidence", fake_extract)
        monkeypatch.setattr(endpoint, "generate_test_script", fake_script)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                analyzed = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert analyzed.status_code == 201, analyzed.text
                assert analyzed.json()["assurance_decision"]["generate_test"] is True
                assert analyzed.json()["test_script"] is None
                assert script_calls == []
                assert analyzed.json()["token_usage"]["total_tokens"] == 7

                generated = http.post(
                    f"/api/v1/assessments/{req.req_key}/generate-script"
                )
                assert generated.status_code == 201, generated.text
                assert "locked" in generated.json()["test_script"]["script"]
                assert script_calls == [{"assurance_level": "scripted", "generate_test": True}]
                assert generated.json()["token_usage"] == {
                    "run_count": 2,
                    "input_tokens": 8,
                    "output_tokens": 3,
                    "total_tokens": 11,
                }
                detail = http.get(f"/api/v1/requirements/{req.req_key}")
                assert detail.status_code == 200
                assert "locked" in detail.json()["tests"][0]["script"]
                assert session.query(TestScript).filter_by(
                    requirement_version_id=version.id
                ).count() == 1
                assert {
                    link.link_type for link in session.query(TraceLink).all()
                } >= {"mitigated_by", "verifies"}
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_run_unscripted_persists_without_script(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        req, _ = _seed_requirement(session, key="LIMS-011")
        record = fake_record_unscripted()
        expected = assess_evidence(record)
        assert expected["assurance"]["generate_test"] is False
        calls = []

        def _no_script(text, assurance):
            calls.append(assurance)
            raise AssertionError("script generator must not run for unscripted")

        monkeypatch.setattr(endpoint, "extract_evidence", lambda text: record)
        monkeypatch.setattr(endpoint, "generate_test_script", _no_script)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert resp.status_code == 201, resp.text
                body = resp.json()
                assert body["assurance_decision"]["generate_test"] is False
                assert body["test_script"] is None
                assert calls == []
                links = session.query(TraceLink).all()
                assert {link.link_type for link in links} >= {
                    "has_risk",
                    "assessed_as",
                }
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_rerun_supersedes_prior_current(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        req, version = _seed_requirement(session, key="LIMS-012")
        record = fake_record_scripted()
        monkeypatch.setattr(endpoint, "extract_evidence", lambda text: record)
        monkeypatch.setattr(
            endpoint, "generate_test_script", lambda text, assurance: _fake_script()
        )
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                first = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert first.status_code == 201, first.text
                second = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert second.status_code == 201, second.text
                assert second.json()["token_usage"]["run_count"] == 2
                assert second.json()["risk_assessment"]["id"] != first.json()[
                    "risk_assessment"
                ]["id"]
                rows = (
                    session.query(RiskAssessment)
                    .filter(RiskAssessment.requirement_version_id == version.id)
                    .all()
                )
                current = [r for r in rows if r.is_current]
                assert len(current) == 1
                assert str(current[0].id) == second.json()["risk_assessment"]["id"]
                old = session.get(
                    RiskAssessment,
                    UUID(first.json()["risk_assessment"]["id"]),
                )
                assert old.is_current is False
                assert old.freshness == "superseded"
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_missing_requirement_returns_404(self, monkeypatch):
        session = make_session()
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.post("/api/v1/assessments/NOPE-999/run")
                assert resp.status_code == 404
                assert session.query(RiskAssessment).count() == 0
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_provider_failure_returns_503_with_rollback(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        req, version = _seed_requirement(session, key="LIMS-013")
        def _provider_failure(text, usage_log=None):
            usage_log.append(
                {
                    "input_tokens": 9,
                    "output_tokens": 2,
                    "total_tokens": 11,
                    "group": "SeverityEvidence",
                    "model": "test",
                    "attempt": 1,
                    "ok": False,
                }
            )
            raise RuntimeError("BEDROCK_MODEL_ID env var is not set.")

        monkeypatch.setattr(endpoint, "extract_evidence", _provider_failure)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert resp.status_code == 503, resp.text
                session.rollback()
                assert session.query(RiskAssessment).count() == 0
                assert session.query(AssuranceDecision).count() == 0
                assert session.query(TestScript).count() == 0
                assert session.query(TraceLink).count() == 0
                failed_usage = (
                    session.query(TokenUsage)
                    .filter_by(
                        requirement_version_id=version.id,
                        status="FAILED",
                    )
                    .one()
                )
                assert failed_usage.total_tokens == 11
                kept = session.get(RequirementVersion, version.id)
                assert kept.is_current is True
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_runtime_failure_returns_500_with_rollback(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        req, _ = _seed_requirement(session, key="LIMS-014")
        record = fake_record_scripted()

        def _boom_script(text, assurance, usage_log=None):
            usage_log.append(
                {
                    "input_tokens": 8,
                    "output_tokens": 2,
                    "total_tokens": 10,
                    "group": "ScriptSteps",
                    "model": "test",
                    "attempt": 1,
                    "ok": False,
                }
            )
            raise ValueError("generator exploded")

        monkeypatch.setattr(endpoint, "extract_evidence", lambda text: record)
        monkeypatch.setattr(endpoint, "generate_test_script", _boom_script)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                analyzed = http.post(f"/api/v1/assessments/{req.req_key}/run")
                assert analyzed.status_code == 201, analyzed.text
                resp = http.post(
                    f"/api/v1/assessments/{req.req_key}/generate-script"
                )
                assert resp.status_code == 500, resp.text
                session.rollback()
                assert session.query(RiskAssessment).count() == 1
                assert session.query(AssuranceDecision).count() == 1
                assert session.query(TokenUsage).filter_by(status="FAILED").one().total_tokens == 10
                assert {
                    link.link_type for link in session.query(TraceLink).all()
                } == {"has_risk", "assessed_as"}
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()
