"""Tests for the Layer 3 evidence record (no AWS, no engines)."""

import pytest
from pydantic import ValidationError

from app.models.evidence import EvidenceRecord


def make_record(**overrides):
    base = {
        "gamp_category": 4,
        "gamp_reason": "Configured LIMS sample registration.",
        "severity": {
            "patient_safety": {
                "value": False,
                "confidence": 0.9,
                "evidence": "No direct patient harm stated.",
            },
            "product_quality": {
                "value": True,
                "confidence": 0.85,
                "evidence": "Reused IDs can misattribute results.",
            },
            "batch_release": {
                "value": False,
                "confidence": 0.9,
                "evidence": "No batch disposition mentioned.",
            },
            "data_integrity": {
                "value": True,
                "confidence": 0.95,
                "evidence": "Duplicate IDs corrupt traceability.",
            },
            "regulatory_compliance": {
                "value": True,
                "confidence": 0.8,
                "evidence": "Traceability is a Part 11 expectation.",
            },
            "business_continuity": {
                "value": False,
                "confidence": 0.9,
                "evidence": "No operational interruption stated.",
            },
        },
        "probability": {
            "functional_complexity": {
                "value": "MEDIUM",
                "confidence": 0.8,
                "evidence": "Uniqueness across active and archived stores.",
            },
            "dependency_complexity": {
                "value": "MEDIUM",
                "confidence": 0.7,
                "evidence": "Touches registration and archive stores.",
            },
            "workflow_complexity": {
                "value": "LOW",
                "confidence": 0.85,
                "evidence": "Single registration step.",
            },
        },
        "detectability": {
            "detection_controls": {
                "value": "MEDIUM",
                "confidence": 0.7,
                "evidence": "No automated duplicate check stated.",
            },
            "traceability": {
                "value": "MEDIUM",
                "confidence": 0.75,
                "evidence": "Records stored, no change history stated.",
            },
            "failure_visibility": {
                "value": "LOW",
                "confidence": 0.8,
                "evidence": "Silent collision looks normal to operators.",
            },
        },
    }
    base.update(overrides)
    return EvidenceRecord(**base)


def test_valid_record_builds():
    rec = make_record()
    assert rec.severity.data_integrity.value is True
    assert rec.probability.functional_complexity.value == "MEDIUM"
    assert rec.detectability.failure_visibility.value == "LOW"
    assert rec.gamp_category == 4


def test_confidence_out_of_range_rejected():
    bad = make_record()
    bad.severity.patient_safety.confidence = 1.5
    with pytest.raises(ValidationError):
        EvidenceRecord(**bad.model_dump())


def test_bad_enum_rejected():
    data = make_record().model_dump()
    data["probability"]["functional_complexity"]["value"] = "EXTREME"
    with pytest.raises(ValidationError):
        EvidenceRecord(**data)


def test_empty_evidence_rejected():
    data = make_record().model_dump()
    data["severity"]["patient_safety"]["evidence"] = ""
    with pytest.raises(ValidationError):
        EvidenceRecord(**data)


def test_bad_gamp_category_rejected():
    with pytest.raises(ValidationError):
        make_record(gamp_category=2)
