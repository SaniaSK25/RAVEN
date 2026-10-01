"""Layer 3 severity engine tests — the spec's worked examples plus
reachability, priority, path, purity, and determinism checks. No AWS."""

import pathlib

from app.models.evidence import SeverityEvidence
from app.services.severity import calculate_severity

FIELDS = (
    "patient_safety",
    "product_quality",
    "batch_release",
    "data_integrity",
    "regulatory_compliance",
    "business_continuity",
)


def severity_of(**true_flags):
    return SeverityEvidence(
        **{
            name: {
                "value": name in true_flags,
                "confidence": 0.9,
                "evidence": f"{name} sentence.",
            }
            for name in FIELDS
        }
    )


def test_example_a_audit_trail_is_sev_r4():
    result = calculate_severity(
        severity_of(data_integrity=True, regulatory_compliance=True)
    )
    assert (result.score, result.rule_id) == (4, "SEV-R4")
    assert [e["check"] for e in result.decision_path] == [
        "patient_safety",
        "product_quality",
        "data_integrity",
        "regulatory_compliance",
    ]


def test_example_b_blank_is_sev_r7():
    result = calculate_severity(severity_of())
    assert (result.score, result.rule_id) == (1, "SEV-R7")


def test_example_c_assay_disposition_is_sev_r2():
    result = calculate_severity(
        severity_of(
            product_quality=True,
            batch_release=True,
            data_integrity=True,
            regulatory_compliance=True,
        )
    )
    assert (result.score, result.rule_id) == (5, "SEV-R2")


def test_priority_patient_safety_beats_all():
    result = calculate_severity(
        severity_of(
            patient_safety=True,
            product_quality=True,
            batch_release=True,
            data_integrity=True,
            regulatory_compliance=True,
        )
    )
    assert (result.score, result.rule_id) == (5, "SEV-R1")
    assert len(result.decision_path) == 1  # stops at first match


def test_product_quality_alone_is_sev_r3():
    result = calculate_severity(severity_of(product_quality=True))
    assert (result.score, result.rule_id) == (4, "SEV-R3")


def test_single_integrity_flag_is_sev_r5():
    result = calculate_severity(severity_of(data_integrity=True))
    assert (result.score, result.rule_id) == (3, "SEV-R5")


def test_business_continuity_alone_is_sev_r6():
    result = calculate_severity(severity_of(business_continuity=True))
    assert (result.score, result.rule_id) == (2, "SEV-R6")


def test_reasoning_never_empty_and_rule_version_set():
    cases = [
        severity_of(patient_safety=True),
        severity_of(product_quality=True),
        severity_of(data_integrity=True, regulatory_compliance=True),
        severity_of(regulatory_compliance=True),
        severity_of(business_continuity=True),
        severity_of(),
    ]
    for evidence in cases:
        result = calculate_severity(evidence)
        assert len(result.reasoning) > 0
        assert len(result.rule_id) > 0
        assert result.rule_version == "3.0.0"


def test_deterministic_across_repeats():
    evidence = severity_of(product_quality=True, data_integrity=True)
    first = calculate_severity(evidence)
    for _ in range(100):
        assert calculate_severity(evidence) == first


def test_engine_source_is_pure():
    src = (
        pathlib.Path(__file__)
        .parent.parent.joinpath("app", "services", "severity.py")
        .read_text()
    )
    for banned in (
        "sqlalchemy",
        "httpx",
        "anthropic",
        "requests",
        "socket",
        "datetime",
        "boto3",
        "ChatBedrock",
    ):
        assert banned not in src
