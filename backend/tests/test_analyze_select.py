"""Analyze-selection tests: pending listing, key parsing, analysis flow."""

import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

import analyze_requirements as analyze
import import_requirements as intake
from test_intake import EXPLORATORY_RECORD, SCRIPTED_RECORD

from app.db.base import Base
from app.models.assurance_decision import AssuranceDecision
from app.models.models import TestScript as PydanticScript
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript as StoredScript


def make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return engine


def fake_extract(text):
    return EXPLORATORY_RECORD if "tooltip" in text else SCRIPTED_RECORD


FAKE_SCRIPT = PydanticScript(
    preconditions="Ready.",
    steps=[{"step_number": 1, "action": "Do X.", "expected_result": "X done."}],
)


def fake_script(text, assurance):
    return FAKE_SCRIPT


def store_only(engine, text):
    with Session(engine) as session:
        return intake.import_sentence(session, text)


def test_pending_lists_unassessed_only():
    engine = make_session()
    store_only(engine, "First pending.")
    store_only(engine, "tooltip text here.")
    with Session(engine) as session:
        pending = analyze.list_pending(session)
    assert [p["req_key"] for p in pending] == ["REQ-0001", "REQ-0002"]
    with Session(engine) as session:
        version_id = pending[0]["version_id"]
        analyze.analyze_version(session, version_id, fake_extract, fake_script)
    with Session(engine) as session:
        pending = analyze.list_pending(session)
    assert [p["req_key"] for p in pending] == ["REQ-0002"]


def test_parse_selection():
    keys = ["REQ-0001", "REQ-0002", "REQ-0003"]
    assert analyze.parse_selection("A", keys) == keys
    assert analyze.parse_selection("all", keys) == keys
    assert analyze.parse_selection("REQ-0003, req-0001", keys) == [
        "REQ-0003",
        "REQ-0001",
    ]
    assert analyze.parse_selection("REQ-0002, REQ-0002", keys) == ["REQ-0002"]
    with pytest.raises(ValueError):
        analyze.parse_selection("REQ-0009", keys)
    with pytest.raises(ValueError):
        analyze.parse_selection("   ", keys)


def test_analyze_selection_assesses_subset():
    engine = make_session()
    store_only(engine, "First item.")
    store_only(engine, "tooltip item here.")
    with Session(engine) as session:
        pending = analyze.list_pending(session)
        chosen = analyze.parse_selection("REQ-0002", [p["req_key"] for p in pending])
        by_key = {p["req_key"]: p for p in pending}
        summary = analyze.analyze_version(
            session, by_key[chosen[0]]["version_id"], fake_extract, fake_script
        )
    assert summary["level"] == "exploratory"
    with Session(engine) as session:
        assert session.query(RiskAssessment).count() == 1
        assert session.query(StoredScript).count() == 0  # exploratory: no script
        assert [p["req_key"] for p in analyze.list_pending(session)] == ["REQ-0001"]
    with Session(engine) as session:
        pending = analyze.list_pending(session)
        assert session.query(AssuranceDecision).one().generate_test is False
        _ = pending


def test_analyze_unknown_version_raises():
    import uuid

    engine = make_session()
    with Session(engine) as session, pytest.raises(ValueError, match="Unknown"):
        analyze.analyze_version(session, uuid.uuid4(), fake_extract, fake_script)
