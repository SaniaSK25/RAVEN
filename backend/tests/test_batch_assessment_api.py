import hashlib

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.batch_token_usage import BatchTokenUsage
from app.models.enums import RequirementStatus
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.token_usage import TokenUsage
from app.schemas.evidence import (
    DetectabilityEvidence,
    EvidenceRecord,
    ProbabilityEvidence,
    SeverityEvidence,
)


def _make_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _seed_requirement(session, key):
    text = f"The system shall support requirement {key}."
    requirement = Requirement(
        title=key,
        description=text,
        req_key=key,
        status=RequirementStatus.DRAFT,
        created_by="batch-test",
    )
    session.add(requirement)
    session.flush()
    version = RequirementVersion(
        requirement_id=requirement.id,
        version_number=1,
        text=text,
        hash_sha256=hashlib.sha256(text.encode()).hexdigest(),
        is_current=True,
    )
    session.add(version)
    session.flush()
    requirement.current_version_id = version.id
    session.commit()
    return requirement


def _unscripted_record():
    boolean = lambda: {"value": False, "confidence": 0.9, "evidence": "Not stated."}
    low = lambda: {"value": "LOW", "confidence": 0.8, "evidence": "Simple."}
    high = lambda: {"value": "HIGH", "confidence": 0.8, "evidence": "Visible."}
    return EvidenceRecord(
        gamp_category=1,
        gamp_reason="Standard configured functionality.",
        severity=SeverityEvidence(
            patient_safety=boolean(),
            product_quality=boolean(),
            batch_release=boolean(),
            data_integrity=boolean(),
            regulatory_compliance=boolean(),
            business_continuity=boolean(),
        ),
        probability=ProbabilityEvidence(
            functional_complexity=low(),
            dependency_complexity=low(),
            workflow_complexity=low(),
        ),
        detectability=DetectabilityEvidence(
            detection_controls=high(),
            traceability=high(),
            failure_visibility=high(),
        ),
    )


def test_batch_assessment_persists_results_and_exact_batch_usage(monkeypatch):
    import app.api.v1.endpoints.assessments as endpoint

    session = _make_session()
    requirements = [
        _seed_requirement(session, "BATCH-001"),
        _seed_requirement(session, "BATCH-002"),
    ]

    def fake_extract_batch(inputs, usage_log=None):
        usage_log.extend(
            [
                {"input_tokens": 120, "output_tokens": 30, "group": "severity"},
                {"input_tokens": 80, "output_tokens": 20, "group": "probability"},
            ]
        )
        return {requirement_id: _unscripted_record() for requirement_id, _ in inputs}

    monkeypatch.setattr(endpoint, "extract_evidence_batch", fake_extract_batch)
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-ci-only")

    from fastapi.testclient import TestClient

    from app.db.session import get_db
    from app.main import app

    def override_db():
        yield session

    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/assessments/batch-run",
                json={"requirement_ids": [item.req_key for item in requirements]},
            )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "SUCCEEDED"
        assert body["requested_count"] == 2
        assert body["succeeded_count"] == 2
        assert body["failed_count"] == 0
        assert body["script_generation"] == "deferred"
        assert body["token_usage"] == {
            "input_tokens": 200,
            "output_tokens": 50,
            "total_tokens": 250,
            "basis": "exact provider-reported batch total",
        }
        assert all(
            item["assurance_decision"]["generate_test"] is False
            and item["test_script_generated"] is False
            for item in body["items"]
        )

        batch = session.query(BatchTokenUsage).one()
        assert batch.total_tokens == 250
        assert batch.succeeded_count == 2
        assert session.query(RiskAssessment).count() == 2
        usage_rows = session.query(TokenUsage).all()
        assert len(usage_rows) == 2
        assert all(row.usage_basis == "batch_estimate" for row in usage_rows)
        assert sum(row.total_tokens for row in usage_rows) == batch.total_tokens
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()


def test_batch_assessment_rejects_more_than_ten_requirements(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-ci-only")
    from fastapi.testclient import TestClient

    from app.db.session import get_db
    from app.main import app

    session = _make_session()

    def override_db():
        yield session

    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/assessments/batch-run",
                json={"requirement_ids": [f"REQ-{index}" for index in range(11)]},
            )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()
