"""RAVEN Layer 3 — full assessment wiring.

Runs the three engines over one frozen EvidenceRecord and joins them
with RPN + band. Pure and deterministic: the only LLM step (extraction)
happens before this function is ever called.
"""

from dataclasses import asdict

from app.models.evidence import EvidenceRecord, SeverityEvidence
from app.services.assurance import decide_assurance
from app.services.detectability import calculate_detectability
from app.services.probability import calculate_probability
from app.services.rpn import DEFAULT_LOW_MAX, DEFAULT_MEDIUM_MAX, calculate_rpn
from app.services.severity import calculate_severity

# Severity flags that constitute GxP impact. business_continuity alone
# (SEV-R6, score 2) is an operational concern, not a GxP one.
GXP_FLAGS = (
    "patient_safety",
    "product_quality",
    "batch_release",
    "data_integrity",
    "regulatory_compliance",
)


def derive_gxp_impact(severity_evidence: SeverityEvidence) -> dict:
    """Derive GxP impact from the frozen severity flags.

    Returns ``{"gxp_impact": bool, "gxp_reason": str}``. The reason is
    never empty (DB enforces non-empty) and lists the raised flags with
    their evidence sentences, or states that no GxP flag was raised.
    """
    raised = [
        name for name in GXP_FLAGS if getattr(severity_evidence, name).value is True
    ]
    if not raised:
        return {
            "gxp_impact": False,
            "gxp_reason": "No GxP impact flags were raised.",
        }
    suffix = " | ".join(
        f"{name}: {getattr(severity_evidence, name).evidence}" for name in raised
    )
    return {
        "gxp_impact": True,
        "gxp_reason": f"GxP impact via {', '.join(raised)}. Supporting evidence: {suffix}",
    }


def assess_evidence(
    record: EvidenceRecord,
    low_max: int = DEFAULT_LOW_MAX,
    medium_max: int = DEFAULT_MEDIUM_MAX,
) -> dict:
    severity = calculate_severity(record.severity)
    probability = calculate_probability(record.probability, record.gamp_category)
    detectability = calculate_detectability(record.detectability)
    outcome = calculate_rpn(
        severity.score, probability.score, detectability.score,
        low_max=low_max, medium_max=medium_max,
    )
    assurance = decide_assurance(severity.score, outcome["band"])
    gxp = derive_gxp_impact(record.severity)
    return {
        "gamp_category": record.gamp_category,
        "gamp_reason": record.gamp_reason,
        "gxp_impact": gxp["gxp_impact"],
        "gxp_reason": gxp["gxp_reason"],
        "severity": asdict(severity),
        "probability": asdict(probability),
        "detectability": asdict(detectability),
        "rpn": outcome["rpn"],
        "rpn_points": outcome["rpn_points"],
        "band": outcome["band"],
        "assurance": assurance,
    }
