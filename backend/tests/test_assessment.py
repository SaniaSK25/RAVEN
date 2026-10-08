"""Full assessment wiring test — one frozen record through all three
engines plus RPN/band. Uses the sample-ID requirement's evidence profile
(di+rc true; MEDIUM/MEDIUM/LOW complexities; MEDIUM/MEDIUM/LOW detection).
No AWS."""

from app.models.evidence import EvidenceRecord
from app.services.assessment import assess_evidence


def sample_record():
    def flag(value):
        return {"value": value, "confidence": 0.9, "evidence": "E."}

    def level(value):
        return {"value": value, "confidence": 0.8, "evidence": "E."}

    return EvidenceRecord(
        gamp_category=4,
        gamp_reason="Configured LIMS.",
        severity={
            "patient_safety": flag(False),
            "product_quality": flag(True),
            "batch_release": flag(False),
            "data_integrity": flag(True),
            "regulatory_compliance": flag(True),
            "business_continuity": flag(False),
        },
        probability={
            "functional_complexity": level("MEDIUM"),
            "dependency_complexity": level("MEDIUM"),
            "workflow_complexity": level("LOW"),
        },
        detectability={
            "detection_controls": level("MEDIUM"),
            "traceability": level("MEDIUM"),
            "failure_visibility": level("LOW"),
        },
    )


def test_sample_requirement_assesses_to_high_75_scripted():
    result = assess_evidence(sample_record())
    # NOTE: product_quality=True outranks data_integrity+regulatory in the
    # tree, so this fires SEV-R3 (not R4) — same score 4, different rule.
    # Priority order matters more than flag count.
    assert result["severity"]["score"] == 4
    assert result["severity"]["rule_id"] == "SEV-R3"
    assert result["probability"]["score"] == 3
    assert result["probability"]["rule_id"] == "PROB-S7"
    assert result["detectability"]["score"] == 4
    assert result["detectability"]["rule_id"] == "DET-S4"
    # Weighted: 12x4 + 5x3 + 3x4 = 75 -> 3.75 -> High.
    assert result["rpn"] == 3.75
    assert result["rpn_points"] == 75
    assert result["band"] == "High"
    # GxP impact via the raised severity flags.
    assert result["gxp_impact"] is True
    assert len(result["gxp_reason"]) > 0
    # Severity 4 forces scripted via the floor (band alone would not).
    assert result["assurance"]["assurance_level"] == "scripted"
    assert result["assurance"]["generate_test"] is True
    assert result["assurance"]["rule_id"] == "ASR-SEV-FLOOR"
    assert result["gamp_category"] == 4


def test_assessment_is_deterministic():
    first = assess_evidence(sample_record())
    for _ in range(20):
        assert assess_evidence(sample_record()) == first
