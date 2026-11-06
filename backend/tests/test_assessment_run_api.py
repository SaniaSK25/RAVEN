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
from app.models.configuration_version import ConfigurationVersion
from app.models.enums import RequirementStatus
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.token_usage import TokenUsage
from app.models.trace_link import TraceLink
from app.schemas.evidence import (
    DetectabilityEvidence,
    EvidenceRecord,
    ProbabilityEvidence,
    SeverityEvidence,
)
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
    """Deterministic evidence producing a scripted high-band decision."""
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
    from app.schemas.test_scripts import TestScript as ScriptModel
    from app.schemas.test_scripts import TestStep

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
    def test_recompute_apply_updates_assessment_with_valid_risk_band(self, monkeypatch):
        from test_intake import EXPLORATORY_RECORD

        import app.api.v1.endpoints.assessments as assessments_endpoint
        import app.api.v1.endpoints.config as config_endpoint
        from app.services import pipeline

        session = make_session()
        requirement, _ = _seed_requirement(session, key="LIMS-BANDS-APPLY")
        monkeypatch.setattr(
            assessments_endpoint,
            "extract_evidence",
            lambda text: EXPLORATORY_RECORD,
        )
        monkeypatch.setattr(
            assessments_endpoint,
            "load_band_config",
            lambda: {"low_max": 70, "medium_max": 80},
        )
        monkeypatch.setattr(
            pipeline,
            "load_band_config",
            lambda: {"low_max": 70, "medium_max": 80},
        )
        monkeypatch.setattr(config_endpoint, "_write_bands_yaml", lambda *_: None)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                initial = http.post(
                    f"/api/v1/assessments/{requirement.req_key}/run"
                )
                assert initial.status_code == 201, initial.text
                assert initial.json()["risk_assessment"]["band"] == "LOW"
                old_assessment_id = initial.json()["risk_assessment"]["id"]

                applied = http.post(
                    "/api/v1/config/recompute/apply",
                    json={"low_max": 45, "medium_max": 67, "confirm": True},
                )
                assert applied.status_code == 200, applied.text
                assert applied.json()["changed"] == 1
                assurance = http.get("/api/v1/assurance").json()
                assert assurance["total"] == 1
                assert assurance["items"][0]["assurance_level"] == "EXPLORATORY"

            current = (
                session.query(RiskAssessment)
                .filter(RiskAssessment.is_current.is_(True))
                .one()
            )
            assert current.band.name == "MEDIUM"
            old_decision = (
                session.query(AssuranceDecision)
                .filter_by(risk_assessment_id=UUID(old_assessment_id))
                .one()
            )
            assert old_decision.freshness == "superseded"
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_recompute_apply_is_repeatable_when_bands_do_not_change(self, monkeypatch):
        import app.api.v1.endpoints.config as config_endpoint

        session = make_session()
        record = fake_record_scripted()
        stored = assess_evidence(record, low_max=45, medium_max=67)
        stored["band"] = stored["band"].upper()
        writes = []
        monkeypatch.setattr(
            config_endpoint,
            "_load_all_current_assessments",
            lambda db: [(record, stored)],
        )
        monkeypatch.setattr(
            config_endpoint,
            "_write_bands_yaml",
            lambda low_max, medium_max: writes.append((low_max, medium_max)),
        )
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                preview = http.post(
                    "/api/v1/config/recompute/preview",
                    json={"low_max": 45, "medium_max": 67, "dry_run": True},
                )
                assert preview.status_code == 200, preview.text
                assert preview.json()["changed"] == 0

                first_apply = http.post(
                    "/api/v1/config/recompute/apply",
                    json={"low_max": 45, "medium_max": 67, "confirm": True},
                )
                assert first_apply.status_code == 200, first_apply.text
                assert first_apply.json()["changed"] == 0

                second_apply = http.post(
                    "/api/v1/config/recompute/apply",
                    json={"low_max": 45, "medium_max": 67, "confirm": True},
                )
                assert second_apply.status_code == 200, second_apply.text
                assert second_apply.json()["changed"] == 0

            assert writes == [(45, 67), (45, 67)]
            assert session.query(ConfigurationVersion).count() == 1
            assert session.query(RiskAssessment).count() == 0
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_ingestion_analyzes_requirements_in_a_single_batch(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint

        session = make_session()
        batch_calls = []
        assessment_config_calls = []
        record = fake_record_unscripted()
        original_assess_evidence = endpoint.assess_evidence

        def fake_load_band_config():
            return {"low_max": 35, "medium_max": 55}

        def assess_with_current_bands(evidence, **thresholds):
            assessment_config_calls.append(thresholds)
            return original_assess_evidence(evidence, **thresholds)

        def fake_extract_batch(inputs, usage_log=None):
            batch_calls.append(inputs)
            usage_log.append(
                {
                    "input_tokens": 8,
                    "output_tokens": 4,
                    "group": "test",
                    "model": "test",
                    "attempt": 1,
                    "ok": True,
                }
            )
            return {requirement_id: record for requirement_id, _ in inputs}

        monkeypatch.setattr(endpoint, "extract_evidence_batch", fake_extract_batch)
        monkeypatch.setattr(endpoint, "load_band_config", fake_load_band_config)
        monkeypatch.setattr(endpoint, "assess_evidence", assess_with_current_bands)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                response = http.post(
                    "/api/v1/requirements/batch",
                    json={
                        "requirements": [
                            {
                                "description": f"The system shall automatically analyze {index}.",
                                "text": f"The system shall automatically analyze {index}.",
                                "created_by": "ingestion-test",
                            }
                            for index in range(12)
                        ]
                    },
                )
                assert response.status_code == 201, response.text
                imported_batch = response.json()
                assert imported_batch["status"] == "IMPORTED"
                assert all(
                    item["status"] == "PENDING"
                    for item in imported_batch["analysis_results"]
                )
                assert len(imported_batch["items"]) == 12
                assert len(batch_calls) == 0
                assert session.query(RiskAssessment).count() == 0
                assert session.query(Requirement).count() == 12

                first_analysis = http.post(
                    f"/api/v1/requirements/batch/{imported_batch['batch_id']}/analyze"
                )
                assert first_analysis.status_code == 200, first_analysis.text
                assert first_analysis.json()["status"] == "IMPORTED"
                assert len(batch_calls) == 1
                assert len(batch_calls[0]) == 10
                assert session.query(RiskAssessment).count() == 10
                refreshed_batch = http.get(
                    f"/api/v1/requirements/batch/{imported_batch['batch_id']}"
                )
                assert refreshed_batch.status_code == 200, refreshed_batch.text
                refreshed_results = refreshed_batch.json()["analysis_results"]
                assert sum(
                    item["status"] == "SUCCEEDED" for item in refreshed_results
                ) == 10
                assert sum(
                    item["status"] == "PENDING" for item in refreshed_results
                ) == 2
                analyzed = http.post(
                    f"/api/v1/requirements/batch/{imported_batch['batch_id']}/analyze"
                )
                repeated = http.get(
                    f"/api/v1/requirements/batch/{imported_batch['batch_id']}"
                )
                no_op_retry = http.post(
                    f"/api/v1/requirements/batch/{imported_batch['batch_id']}/analyze"
                )
            assert analyzed.status_code == 200, analyzed.text
            body = analyzed.json()
            assert body["status"] == "COMPLETED"
            assert all(
                item["status"] == "SUCCEEDED" for item in body["analysis_results"]
            )
            assert body["token_usage"]["total_tokens"] == 24
            assert len(batch_calls) == 2
            assert len(batch_calls[0]) == 10
            assert len(batch_calls[1]) == 2
            assert assessment_config_calls == [
                {"low_max": 35, "medium_max": 55}
            ] * 12
            assert session.query(RiskAssessment).count() == 12
            assert repeated.status_code == 200, repeated.text
            assert repeated.json()["status"] == "COMPLETED"
            assert len(repeated.json()["analysis_results"]) == 12
            assert no_op_retry.status_code == 200, no_op_retry.text
            assert no_op_retry.json()["status"] == "COMPLETED"
            assert len(batch_calls) == 2
            assert session.query(RiskAssessment).count() == 12
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_on_demand_assessment_uses_saved_band_thresholds(self, monkeypatch):
        import app.api.v1.endpoints.assessments as endpoint
        from app.services import pipeline

        session = make_session()
        requirement, _ = _seed_requirement(session, key="LIMS-BANDS-001")
        observed_thresholds = []
        record = fake_record_unscripted()
        original_assess_evidence = pipeline.assess_evidence

        def fake_extract(text, usage_log=None):
            return record

        def fake_load_band_config():
            return {"low_max": 35, "medium_max": 55}

        def assess_with_current_bands(evidence, **thresholds):
            observed_thresholds.append(thresholds)
            return original_assess_evidence(evidence, **thresholds)

        monkeypatch.setattr(endpoint, "extract_evidence", fake_extract)
        monkeypatch.setattr(pipeline, "load_band_config", fake_load_band_config)
        monkeypatch.setattr(pipeline, "assess_evidence", assess_with_current_bands)
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                response = http.post(
                    f"/api/v1/assessments/{requirement.req_key}/run"
                )
            assert response.status_code == 201, response.text
            assert observed_thresholds == [
                {"low_max": 35, "medium_max": 55}
            ]
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

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


    def test_edit_automatically_runs_analysis_and_resolves_change(self, monkeypatch):
        import app.api.v1.endpoints.assessments as assessments_endpoint
        import app.api.v1.endpoints.changes as changes_endpoint
        import app.api.v1.endpoints.requirements as requirements_endpoint

        session = make_session()
        req, _ = _seed_requirement(session, key="LIMS-020")
        analysis_calls = []
        reanalysis_calls = []
        classification_calls = []

        def fake_run_assessment(requirement_id, db):
            analysis_calls.append((requirement_id, db))

        def fake_reanalyze(event_id, payload, db):
            reanalysis_calls.append((event_id, payload.created_by, db))

        def fake_classify_after_change():
            classification_calls.append(True)

        monkeypatch.setattr(requirements_endpoint, "SessionLocal", lambda: session)
        monkeypatch.setattr(
            requirements_endpoint,
            "_classify_after_requirement_change",
            fake_classify_after_change,
        )
        monkeypatch.setattr(
            assessments_endpoint, "run_assessment", fake_run_assessment
        )
        monkeypatch.setattr(changes_endpoint, "reanalyze", fake_reanalyze)
        app, client, get_db = _client(monkeypatch, session)
        try:
            response = client.patch(
                f"/api/v1/requirements/{req.id}",
                json={"text": "The system shall lock accounts after five failures."},
            )
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["status"] == "changed"
            assert analysis_calls == [(body["requirement_id"], session)]
            assert reanalysis_calls == [
                (body["event_id"], "automatic-edit-analysis", session)
            ]
            assert classification_calls == [True]
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
