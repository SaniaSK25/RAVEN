"""Layer 3 detectability engine tests — anchors, full 27-matrix,
worsening-monotonicity, controls floor, purity. No AWS."""

import itertools
import pathlib

from app.models.evidence import DetectabilityEvidence
from app.services.detectability import calculate_detectability

LEVELS = ("HIGH", "MEDIUM", "LOW")

FULL_MATRIX = {
    ("HIGH", "HIGH", "HIGH"): 1,
    ("HIGH", "HIGH", "MEDIUM"): 2,
    ("HIGH", "HIGH", "LOW"): 2,
    ("HIGH", "MEDIUM", "HIGH"): 2,
    ("HIGH", "MEDIUM", "MEDIUM"): 2,
    ("HIGH", "MEDIUM", "LOW"): 3,
    ("HIGH", "LOW", "HIGH"): 2,
    ("HIGH", "LOW", "MEDIUM"): 3,
    ("HIGH", "LOW", "LOW"): 4,
    ("MEDIUM", "HIGH", "HIGH"): 2,
    ("MEDIUM", "HIGH", "MEDIUM"): 2,
    ("MEDIUM", "HIGH", "LOW"): 3,
    ("MEDIUM", "MEDIUM", "HIGH"): 2,
    ("MEDIUM", "MEDIUM", "MEDIUM"): 3,
    ("MEDIUM", "MEDIUM", "LOW"): 4,
    ("MEDIUM", "LOW", "HIGH"): 3,
    ("MEDIUM", "LOW", "MEDIUM"): 4,
    ("MEDIUM", "LOW", "LOW"): 4,
    ("LOW", "HIGH", "HIGH"): 2,
    ("LOW", "HIGH", "MEDIUM"): 3,
    ("LOW", "HIGH", "LOW"): 4,
    ("LOW", "MEDIUM", "HIGH"): 3,
    ("LOW", "MEDIUM", "MEDIUM"): 4,
    ("LOW", "MEDIUM", "LOW"): 4,
    ("LOW", "LOW", "HIGH"): 4,
    ("LOW", "LOW", "MEDIUM"): 4,
    ("LOW", "LOW", "LOW"): 5,
}


def evidence_of(c, t, v):
    def field(value):
        return {"value": value, "confidence": 0.8, "evidence": f"{value}."}

    return DetectabilityEvidence(
        detection_controls=field(c),
        traceability=field(t),
        failure_visibility=field(v),
    )


def test_anchors():
    assert calculate_detectability(evidence_of("HIGH", "HIGH", "HIGH")).score == 1
    assert calculate_detectability(evidence_of("HIGH", "HIGH", "MEDIUM")).score == 2
    assert calculate_detectability(evidence_of("HIGH", "MEDIUM", "LOW")).score == 3
    assert calculate_detectability(evidence_of("MEDIUM", "MEDIUM", "LOW")).score == 4
    assert calculate_detectability(evidence_of("LOW", "LOW", "LOW")).score == 5


def test_full_27_matrix():
    assert len(FULL_MATRIX) == 27
    for (c, t, v), expected in FULL_MATRIX.items():
        result = calculate_detectability(evidence_of(c, t, v))
        assert result.score == expected, (c, t, v)
        assert result.rule_id.startswith("DET-S")
        assert len(result.reasoning) > 0


def test_monotonic_worsening_never_lowers_score():
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    for combo in itertools.product(LEVELS, repeat=3):
        base = calculate_detectability(evidence_of(*combo)).score
        for pos in range(3):
            worse = list(combo)
            worse[pos] = LEVELS[min(2, order[combo[pos]] + 1)]
            assert calculate_detectability(evidence_of(*worse)).score >= base


def test_controls_floor():
    # MEDIUM/MEDIUM/HIGH sums to 2 -> score 2, floor 3 raises it.
    result = calculate_detectability(
        evidence_of("MEDIUM", "MEDIUM", "HIGH"), controls_floor=3
    )
    assert result.score == 3
    assert result.decision_path[-1]["floor_applied"] is True
    # Floor never applies when controls are HIGH, even if set.
    result = calculate_detectability(
        evidence_of("HIGH", "HIGH", "HIGH"), controls_floor=3
    )
    assert result.score == 1
    assert result.decision_path[-1]["floor_applied"] is False


def test_rule_id_encodes_sum():
    result = calculate_detectability(evidence_of("MEDIUM", "MEDIUM", "LOW"))
    assert result.rule_id == "DET-S4"  # 1+1+2
    assert result.decision_path[-1]["sum"] == 4


def test_engine_source_is_pure():
    src = (
        pathlib.Path(__file__)
        .parent.parent.joinpath("app", "services", "detectability.py")
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
