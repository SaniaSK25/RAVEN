"""CSV/JSON intake + persistence tests (SQLite :memory:, LLM faked)."""

import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

import import_requirements as intake

from app.db.base import Base
from app.models.assurance_decision import AssuranceDecision
from app.models.configuration_version import ConfigurationVersion
from app.models.evidence import EvidenceRecord
from app.models.models import TestScript as PydanticScript
from app.models.prompt_version import PromptVersion
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.stored_evidence import Evidence as StoredEvidence
from app.models.test_script import TestScript as StoredScript
from app.services.assessment import assess_evidence


def flag(value):
    return {"value": value, "confidence": 0.9, "evidence": "E."}


def level(value):
    return {"value": value, "confidence": 0.8, "evidence": "E."}


def make_record(severity_flags, complexities, detections):
    sev_names = (
        "patient_safety",
        "product_quality",
        "batch_release",
        "data_integrity",
        "regulatory_compliance",
        "business_continuity",
    )
    return EvidenceRecord(
        gamp_category=4,
        gamp_reason="Configured.",
        severity={n: flag(severity_flags.get(n, False)) for n in sev_names},
        probability={
            "functional_complexity": level(complexities[0]),
            "dependency_complexity": level(complexities[1]),
            "workflow_complexity": level(complexities[2]),
        },
        detectability={
            "detection_controls": level(detections[0]),
            "traceability": level(detections[1]),
            "failure_visibility": level(detections[2]),
        },
    )


SCRIPTED_RECORD = make_record(
    {"product_quality": True, "data_integrity": True, "regulatory_compliance": True},
    ("MEDIUM", "MEDIUM", "LOW"),
    ("MEDIUM", "MEDIUM", "LOW"),
)
EXPLORATORY_RECORD = make_record(
    {"data_integrity": True},
    ("MEDIUM", "MEDIUM", "MEDIUM"),
    ("MEDIUM", "MEDIUM", "MEDIUM"),
)

FAKE_SCRIPT = PydanticScript(
    preconditions="Ready.",
    steps=[{"step_number": 1, "action": "Do X.", "expected_result": "X done."}],
)


def make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def fake_extract(text):
    return EXPLORATORY_RECORD if "tooltip" in text else SCRIPTED_RECORD


def fake_script(text, assurance):
    return FAKE_SCRIPT


def test_parse_csv_and_json(tmp_path):
    csv_file = tmp_path / "reqs.csv"
    csv_file.write_text("text,extra\nFirst sentence.,x\n, \nSecond sentence.,y\n")
    assert intake.parse_csv(str(csv_file)) == [
        (2, "First sentence."),
        (3, None),
        (4, "Second sentence."),
    ]
    bad_csv = tmp_path / "bad.csv"
    bad_csv.write_text("nope\nx\n")
    with pytest.raises(ValueError):
        intake.parse_csv(str(bad_csv))
    json_file = tmp_path / "reqs.json"
    json_file.write_text('["A.", {"text": "B."}, 42, " "]')
    assert intake.parse_json(str(json_file)) == [
        (1, "A."),
        (2, "B."),
        (3, None),
        (4, None),
    ]
    not_list = tmp_path / "obj.json"
    not_list.write_text('{"a": 1}')
    with pytest.raises(TypeError):
        intake.parse_json(str(not_list))


def test_import_two_sentences_gets_sequential_keys():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        r1 = intake.import_sentence(
            session,
            "Samples get unique IDs.",
            fake_extract,
            fake_script,
            run_pipeline=True,
        )
        r2 = intake.import_sentence(
            session,
            "Sessions lock after delay.",
            fake_extract,
            fake_script,
            run_pipeline=True,
        )
    assert r1 == {"status": "imported", "req_key": "REQ-0001"}
    assert r2 == {"status": "imported", "req_key": "REQ-0002"}


def test_import_persists_linked_rows():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        intake.import_sentence(
            session,
            "Samples get unique IDs.",
            fake_extract,
            fake_script,
            run_pipeline=True,
        )
        req = session.query(Requirement).one()
        assert req.req_key == "REQ-0001"
        assert req.current_version_id is not None
        version = session.query(RequirementVersion).one()
        assert version.hash_sha256 and version.is_current is True
        stored = session.query(StoredEvidence).one()
        assert stored.data_integrity_value is True
        ra = session.query(RiskAssessment).one()
        assert (ra.rpn_points, ra.band.name) == (75, "HIGH")
        assert session.query(AssuranceDecision).one().generate_test is True
        assert session.query(StoredScript).one().script.startswith("Ready.")
        assert session.query(ConfigurationVersion).one().version == "3.0.0"
        assert session.query(PromptVersion).count() == 2


def test_store_only_writes_rows_without_llm():
    def _boom(text):
        raise AssertionError("LLM must not be called in store-only mode")

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        result = intake.import_sentence(session, "Just store me.", _boom, _boom)
    assert result == {"status": "imported", "req_key": "REQ-0001"}
    with Session(engine) as session:
        assert session.query(Requirement).one().current_version_id is not None
        assert session.query(RiskAssessment).count() == 0


def test_duplicate_sentence_skipped():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        first = intake.import_sentence(
            session, "Same text.", fake_extract, fake_script, run_pipeline=True
        )
        second = intake.import_sentence(
            session, "Same text.", fake_extract, fake_script, run_pipeline=True
        )
    assert first["status"] == "imported"
    assert second == {"status": "skipped", "reason": "duplicate text"}
    with Session(engine) as session:
        assert session.query(Requirement).count() == 1


def test_exploratory_writes_no_script():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        intake.import_sentence(
            session,
            "tooltip help text.",
            fake_extract,
            fake_script,
            run_pipeline=True,
        )
        ra = session.query(RiskAssessment).one()
        assert ra.band.name == "MEDIUM"
        ad = session.query(AssuranceDecision).one()
        assert ad.generate_test is False
        assert session.query(StoredScript).count() == 0


def test_persistence_gate_rejects_mismatches():
    from app.services.persistence import save_assessment

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        version = RequirementVersion(
            requirement_id="00000000-0000-0000-0000-000000000000",
            version_number=1,
            text="T.",
            hash_sha256="x",
        )
        assessment = assess_evidence(EXPLORATORY_RECORD)
        with pytest.raises(ValueError):
            save_assessment(
                session, version, EXPLORATORY_RECORD, assessment, FAKE_SCRIPT
            )
        scripted = assess_evidence(SCRIPTED_RECORD)
        with pytest.raises(ValueError):
            save_assessment(session, version, SCRIPTED_RECORD, scripted, None)
