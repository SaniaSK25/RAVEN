"""RAVEN Layer 3 — weighted risk score and banding.

Weighted sum (severity dominates by design):
    points = 12 x Severity + 5 x Probability + 3 x Detectability
which equals 20 x (0.6 x S + 0.25 x P + 0.15 x D) in pure integer math
(range 20-100, no floating-point dust). Display scale is points / 20
(range 1.0-5.0). Bands (user-defined):
    Low    1.0-2.29  (points <= 45) -> unscripted
    Medium 2.3-3.39  (points 46-67) -> exploratory
    High   3.4-5.0   (points >= 68) -> scripted
"""


def calculate_rpn(severity: int, probability: int, detectability: int) -> dict:
    for name, score in (
        ("severity", severity),
        ("probability", probability),
        ("detectability", detectability),
    ):
        if not isinstance(score, int) or not 1 <= score <= 5:
            raise ValueError(f"{name} score must be an int 1-5, got {score!r}.")

    points = 12 * severity + 5 * probability + 3 * detectability
    rpn = round(points / 20, 2)
    if points <= 45:
        band = "Low"
    elif points <= 67:
        band = "Medium"
    else:
        band = "High"
    return {"rpn": rpn, "rpn_points": points, "band": band}
