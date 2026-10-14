"""RAVEN Layer 3 — weighted risk score and banding.

Severity dominates by design:
    points = 12 x Severity + 5 x Probability + 3 x Detectability
which equals 20 x (0.6 x S + 0.25 x P + 0.15 x D) in pure integer math
(range 20-100, no floating-point dust). Display scale is points / 20
(range 1.0-5.0). Bands (configurable via ``config/rules/bands.yaml``):
    Low     points <= 45  (rpn <= 2.25) -> unscripted
    Medium  points 46-67  (rpn 2.3-3.35) -> exploratory
    High    points >= 68  (rpn >= 3.4)  -> scripted

Pure function: no LLM, no DB, no network, no clock.
"""

from __future__ import annotations

# Default band thresholds on the points scale (20-100). Teams may
# override at runtime via config/rules/bands.yaml (low_max / medium_max).
DEFAULT_LOW_MAX = 45
DEFAULT_MEDIUM_MAX = 67

POINTS_MIN = 20
POINTS_MAX = 100


def calculate_rpn(
    severity: int,
    probability: int,
    detectability: int,
    low_max: int = DEFAULT_LOW_MAX,
    medium_max: int = DEFAULT_MEDIUM_MAX,
) -> dict:
    """Compute weighted risk score and band from the three 1-5 scores.

    Args:
        severity: severity score 1-5.
        probability: probability score 1-5.
        detectability: detectability score 1-5.
        low_max: points upper bound of the Low band (default 45).
        medium_max: points upper bound of the Medium band (default 67).

    Returns:
        ``{"rpn": float, "rpn_points": int, "band": "Low" | "Medium" | "High"}``.
    """
    for name, score in (
        ("severity", severity),
        ("probability", probability),
        ("detectability", detectability),
    ):
        # bool is a subclass of int — reject it explicitly so that
        # True/False can never slip in as 1/0.
        if isinstance(score, bool) or not isinstance(score, int) or not 1 <= score <= 5:
            raise ValueError(f"{name} score must be an int 1-5, got {score!r}.")

    points = 12 * severity + 5 * probability + 3 * detectability
    rpn = round(points / 20, 2)

    if points <= low_max:
        band = "Low"
    elif points <= medium_max:
        band = "Medium"
    else:
        band = "High"
    return {"rpn": rpn, "rpn_points": points, "band": band}
