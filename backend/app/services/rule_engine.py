"""Deprecated legacy risk shim.

The old ``calculate_risk`` took a ``RequirementAnalysis`` object with
level labels (severity Low/Medium/High/Critical, etc.) and used
ad-hoc maps. It is kept only so old imports fail loudly with guidance
instead of silently producing wrong scores.

Use instead:
    from app.services.severity import calculate_severity
    from app.services.probability import calculate_probability
    from app.services.detectability import calculate_detectability
    from app.services.rpn import calculate_rpn
    from app.services.assessment import assess_evidence
"""

from app.services.rpn import calculate_rpn as _calculate_rpn


def calculate_risk(
    severity_score: int,
    probability_score: int | None = None,
    detectability_score: int | None = None,
    low_max: int = 45,
    medium_max: int = 67,
) -> dict:
    """Backward-compatible entry point on the weighted-points scale.

    Takes the three 1-5 engine scores and returns
    ``{"severity_score", "probability_score", "detectability_score",
    "total_risk_score", "rpn_points", "risk_band"}``. Prefer
    :func:`calculate_rpn` / :func:`assess_evidence` for new code.
    """
    if probability_score is None or detectability_score is None:
        raise TypeError(
            "calculate_risk() now takes three 1-5 ints "
            "(severity, probability, detectability). The legacy "
            "RequirementAnalysis object scheme is retired; use "
            "assess_evidence(EvidenceRecord) instead."
        )
    outcome = _calculate_rpn(
        severity_score, probability_score, detectability_score,
        low_max=low_max, medium_max=medium_max,
    )
    return {
        "severity_score": severity_score,
        "probability_score": probability_score,
        "detectability_score": detectability_score,
        "total_risk_score": outcome["rpn"],
        "rpn_points": outcome["rpn_points"],
        "risk_band": outcome["band"].upper(),
    }
