"""Read-only list endpoints for persisted assessments + assurance decisions.

Covers GET /api/v1/assessments and GET /api/v1/assurance: stable
{items, total, skip, limit} shape, requirement key/title/version, persisted
rule/decision values, and freshness/current-version semantics. No scoring is
performed here; all values are read back verbatim.
"""

import hashlib
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.assurance_decision import AssuranceDecision
from app.models.configuration_version import ConfigurationVersion
from app.models.engine_results import (
    DetectabilityResult,
    ProbabilityResult,
    SeverityResult,
)
from app.models.enums import AssuranceLevel, RequirementStatus, RiskBand
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment


def make_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _requirement(session, key="LIMS-001", title="Assessed requirement"):
    text = f"original text {key}"
    req = Requirement(
        title=title,
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
    return req, version


def _ensure_config(session):
    config = session.query(ConfigurationVersion).filter_by(version="1.0.0").first()
    if config is None:
        config = ConfigurationVersion(version="1.0.0", config_hash="a" * 64)
        session.add(config)
        session.flush()
    return config


def seed_assessed(session, key="LIMS-001", freshness="fresh"):
    """One requirement with one persisted assessment + decision + sub-results."""
    config = _ensure_config(session)
    req, version = _requirement(session, key=key)
    risk = RiskAssessment(
        requirement_version_id=version.id,
        evidence_id=uuid.uuid4(),
        rule_config_version_id=config.id,
        gxp_impact=True,
        gxp_reason="gxp reason",
        gamp_category="Category 4",
        gamp_reason="gamp reason",
        rpn=3.75,
        rpn_points=75,
        band=RiskBand.HIGH,
        status="FINAL",
        is_current=True,
        freshness=freshness,
    )
    session.add(risk)
    session.flush()
    sev = SeverityResult(
        risk_assessment_id=risk.id,
        score=4,
        rule_id="SEV-R3",
        rule_version="1.0.0",
        decision_path=[
            {
                "check": "patient_safety",
                "result": False,
                "evidence": "No direct patient safety impact was described.",
            },
            {
                "check": "product_quality",
                "result": True,
                "evidence": "The requirement protects product quality.",
            },
            {
                "check": "batch_release",
                "result": False,
                "evidence": "The requirement does not participate in batch release.",
            },
        ],
        reasoning="severity reasoning",
    )
    prob = ProbabilityResult(
        risk_assessment_id=risk.id,
        score=3,
        rule_id="PROB-S7",
        rule_version="1.0.0",
        decision_path=[
            {
                "check": "functional_complexity",
                "result": "HIGH",
                "points": 3,
                "weight": 2,
                "weighted": 6,
                "evidence": "The requirement describes several interacting behaviours.",
            },
            {
                "check": "dependency_complexity",
                "result": "LOW",
                "points": 1,
                "weight": 1,
                "weighted": 1,
                "evidence": "No external dependencies are specified.",
            },
            {
                "check": "workflow_complexity",
                "result": "MEDIUM",
                "points": 2,
                "weight": 1,
                "weighted": 2,
                "evidence": "The workflow includes multiple user steps.",
            },
            {
                "check": "computation",
                "sum": 9,
                "mapped": 4,
                "gamp_category": 4,
                "gamp_modifier": 0,
                "final_score": 4,
            },
        ],
        weighted_sum=9.0,
        gamp_modifier=0.0,
        reasoning="probability reasoning",
    )
    det = DetectabilityResult(
        risk_assessment_id=risk.id,
        score=4,
        rule_id="DET-S4",
        rule_version="1.0.0",
        decision_path=[
            {
                "check": "detection_controls",
                "result": "MEDIUM",
                "points": 1,
                "evidence": "Some automated validation is present.",
            },
            {
                "check": "traceability",
                "result": "LOW",
                "points": 2,
                "evidence": "The audit history may be incomplete.",
            },
            {
                "check": "failure_visibility",
                "result": "MEDIUM",
                "points": 1,
                "evidence": "Failure may require review to identify.",
            },
            {
                "check": "computation",
                "sum": 4,
                "mapped_score": 4,
                "controls_floor": 2,
                "floor_applied": False,
                "final_score": 4,
            },
        ],
        controls_floor=2,
        reasoning="detectability reasoning",
    )
    session.add_all([sev, prob, det])
    session.flush()
    risk.severity_result_id = sev.id
    risk.probability_result_id = prob.id
    risk.detectability_result_id = det.id
    session.flush()
    decision = AssuranceDecision(
        risk_assessment_id=risk.id,
        assurance_level=AssuranceLevel.SCRIPTED,
        rule_id="ASR-BAND-HIGH",
        rule_version="1.0.0",
        generate_test=True,
        reasoning="high band reasoning",
        decision_path={"severity": 4, "band": "High", "level": "scripted"},
        freshness=freshness,
    )
    session.add(decision)
    session.flush()
    return {"req": req, "version": version, "risk": risk, "decision": decision}


def _client(monkeypatch, session):
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-ci-only")
    from fastapi.testclient import TestClient

    from app.db.session import get_db
    from app.main import app

    def override_db():
        yield session

    app.dependency_overrides[get_db] = override_db
    return app, TestClient(app), get_db


class TestAssessmentList:
    def test_empty_returns_stable_shape(self, monkeypatch):
        session = make_session()
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.get("/api/v1/assessments")
                assert resp.status_code == 200
                body = resp.json()
                assert body["items"] == []
                assert body["total"] == 0
                assert body["skip"] == 0
                assert body["limit"] == 100
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_returns_persisted_values_with_requirement_context(self, monkeypatch):
        session = make_session()
        seed_assessed(session, key="LIMS-001")
        session.commit()
        app, client, _ = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.get("/api/v1/assessments")
                assert resp.status_code == 200
                body = resp.json()
                assert body["total"] == 1
                item = body["items"][0]
                assert item["requirement_key"] == "LIMS-001"
                assert item["requirement_title"] == "original text LIMS-001"
                assert item["version"] == 1
                assert item["current_requirement_version"] == 1
                assert item["is_current_version"] is True
                assert item["freshness"] == "fresh"
                assert item["severity"] == 4
                assert item["probability"] == 3
                assert item["detectability"] == 4
                assert item["severity_rule_id"] == "SEV-R3"
                assert item["probability_rule_id"] == "PROB-S7"
                assert item["detectability_rule_id"] == "DET-S4"
                assert item["severity_reasoning"] == "severity reasoning"
                assert item["probability_reasoning"] == "probability reasoning"
                assert item["detectability_reasoning"] == "detectability reasoning"
                assert item["severity_decision_path"][1]["evidence"] == (
                    "The requirement protects product quality."
                )
                assert item["probability_decision_path"][0]["weighted"] == 6
                assert item["detectability_decision_path"][0]["result"] == "MEDIUM"
                assert item["gamp_reason"] is None
                assert item["rpn"] == 3.75
                assert item["rpn_points"] == 75
                assert item["band"] == "HIGH"
                assert item["rule_version"] == "1.0.0"
        finally:
            from app.db.session import get_db as _get_db

            app.dependency_overrides.pop(_get_db, None)
            session.close()

    def test_superseded_hidden_by_default_and_visible_on_request(self, monkeypatch):
        session = make_session()
        seed_assessed(session, key="LIMS-001", freshness="fresh")
        seed_assessed(session, key="LIMS-002", freshness="superseded")
        session.commit()
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                default = http.get("/api/v1/assessments")
                assert default.json()["total"] == 1
                assert default.json()["items"][0]["requirement_key"] == "LIMS-001"

                all_rows = http.get(
                    "/api/v1/assessments", params={"include_superseded": True}
                )
                assert all_rows.json()["total"] == 2

                stale_only = http.get(
                    "/api/v1/assessments", params={"freshness": "fresh"}
                )
                assert stale_only.json()["total"] == 1

                by_key = http.get(
                    "/api/v1/assessments", params={"requirement_key": "LIMS-001"}
                )
                assert by_key.json()["total"] == 1
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()


class TestAssuranceList:
    def test_returns_persisted_decision_with_requirement_context(self, monkeypatch):
        session = make_session()
        seed_assessed(session, key="LIMS-001")
        session.commit()
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                resp = http.get("/api/v1/assurance")
                assert resp.status_code == 200
                body = resp.json()
                assert body["total"] == 1
                item = body["items"][0]
                assert item["requirement_key"] == "LIMS-001"
                assert item["requirement_title"] == "original text LIMS-001"
                assert item["version"] == 1
                assert item["current_requirement_version"] == 1
                assert item["is_current_version"] is True
                assert item["assurance_level"] == "SCRIPTED"
                assert item["rule_id"] == "ASR-BAND-HIGH"
                assert item["rule_version"] == "1.0.0"
                assert item["generate_test"] is True
                assert item["freshness"] == "fresh"
                assert item["band"] == "HIGH"
                assert item["rpn"] == 3.75
                assert item["rpn_points"] == 75
                assert item["severity"] == 4
                assert item["gxp_impact"] is True
                assert item["gamp_category"] == "Category 4"
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_superseded_decisions_hidden_by_default(self, monkeypatch):
        session = make_session()
        seed_assessed(session, key="LIMS-001", freshness="fresh")
        seed_assessed(session, key="LIMS-002", freshness="superseded")
        session.commit()
        app, client, get_db = _client(monkeypatch, session)
        try:
            with client as http:
                assert http.get("/api/v1/assurance").json()["total"] == 1
                assert (
                    http.get(
                        "/api/v1/assurance", params={"include_superseded": True}
                    ).json()["total"]
                    == 2
                )
                assert (
                    http.get(
                        "/api/v1/assurance", params={"requirement_key": "LIMS-002"}
                    ).json()["total"]
                    == 0
                )
                assert (
                    http.get(
                        "/api/v1/assurance",
                        params={
                            "requirement_key": "LIMS-002",
                            "include_superseded": True,
                        },
                    ).json()["total"]
                    == 1
                )
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()

    def test_routers_register_expected_paths(self, monkeypatch):
        monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-ci-only")
        from app.main import app

        paths = set(app.openapi()["paths"])
        assert "/api/v1/assessments" in paths
        assert "/api/v1/assurance" in paths
