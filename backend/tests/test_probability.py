"""Layer 3 probability engine tests — anchors, full 27-matrix,
monotonicity, GAMP clamp, purity, determinism. No AWS."""

import itertools
import pathlib

from app.models.evidence import ProbabilityEvidence
from app.services.probability import calculate_probability

LEVELS = ("LOW", "MEDIUM", "HIGH")

# (functional, dependency, workflow) -> expected score, per spec matrix.
FULL_MATRIX = {
    ("LOW", "LOW", "LOW"): 1,
    ("LOW", "LOW", "MEDIUM"): 2,
    ("LOW", "LOW", "HIGH"): 2,
    ("LOW", "MEDIUM", "LOW"): 2,
    ("LOW", "MEDIUM", "MEDIUM"): 2,
    ("LOW", "MEDIUM", "HIGH"): 3,
    ("LOW", "HIGH", "LOW"): 2,
    ("LOW", "HIGH", "MEDIUM"): 3,
    ("LOW", "HIGH", "HIGH"): 3,
    ("MEDIUM", "LOW", "LOW"): 2,
    ("MEDIUM", "LOW", "MEDIUM"): 3,
    ("MEDIUM", "LOW", "HIGH"): 3,
    ("MEDIUM", "MEDIUM", "LOW"): 3,
    ("MEDIUM", "MEDIUM", "MEDIUM"): 3,
    ("MEDIUM", "MEDIUM", "HIGH"): 4,
    ("MEDIUM", "HIGH", "LOW"): 3,
    ("MEDIUM", "HIGH", "MEDIUM"): 4,
    ("MEDIUM", "HIGH", "HIGH"): 4,
    ("HIGH", "LOW", "LOW"): 3,
    ("HIGH", "LOW", "MEDIUM"): 4,
    ("HIGH", "LOW", "HIGH"): 4,
    ("HIGH", "MEDIUM", "LOW"): 4,
    ("HIGH", "MEDIUM", "MEDIUM"): 4,
    ("HIGH", "MEDIUM", "HIGH"): 4,
    ("HIGH", "HIGH", "LOW"): 4,
    ("HIGH", "HIGH", "MEDIUM"): 4,
    ("HIGH", "HIGH", "HIGH"): 5,
}


def evidence_of(f, d, w):
    def field(value):
        return {"value": value, "confidence": 0.8, "evidence": f"{value}."}

    return ProbabilityEvidence(
        functional_complexity=field(f),
        dependency_complexity=field(d),
        workflow_complexity=field(w),
    )


def test_anchors():
    assert calculate_probability(evidence_of("LOW", "LOW", "LOW"), 4).score == 1
    assert calculate_probability(evidence_of("LOW", "LOW", "MEDIUM"), 4).score == 2
    assert calculate_probability(evidence_of("LOW", "MEDIUM", "MEDIUM"), 4).score == 2
    assert calculate_probability(evidence_of("MEDIUM", "LOW", "MEDIUM"), 4).score == 3
    assert (
        calculate_probability(evidence_of("MEDIUM", "MEDIUM", "MEDIUM"), 4).score == 3
    )
    assert calculate_probability(evidence_of("HIGH", "LOW", "MEDIUM"), 4).score == 4
    assert calculate_probability(evidence_of("HIGH", "MEDIUM", "HIGH"), 4).score == 4
    assert calculate_probability(evidence_of("HIGH", "HIGH", "HIGH"), 4).score == 5


def test_full_27_matrix():
    assert len(FULL_MATRIX) == 27
    for (f, d, w), expected in FULL_MATRIX.items():
        result = calculate_probability(evidence_of(f, d, w), 4)
        assert result.score == expected, (f, d, w)
        assert result.rule_id.startswith("PROB-S")
        assert len(result.reasoning) > 0


def test_monotonic_raising_input_never_lowers_score():
    order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    for combo in itertools.product(LEVELS, repeat=3):
        base = calculate_probability(evidence_of(*combo), 4).score
        for pos in range(3):
            raised = list(combo)
            raised[pos] = LEVELS[min(2, order[combo[pos]] + 1)]
            assert calculate_probability(evidence_of(*raised), 4).score >= base


def test_gamp_modifier_clamps():
    base = evidence_of("HIGH", "HIGH", "HIGH")  # mapped 5
    assert calculate_probability(base, 5, modifier={5: 3}).score == 5  # not 8
    low = evidence_of("LOW", "LOW", "LOW")  # mapped 1
    assert calculate_probability(low, 1, modifier={1: -3}).score == 1  # not -2
    mid = evidence_of("MEDIUM", "MEDIUM", "MEDIUM")  # mapped 3
    assert calculate_probability(mid, 5, modifier={5: 1}).score == 4


def test_rule_id_encodes_sum():
    result = calculate_probability(evidence_of("MEDIUM", "HIGH", "MEDIUM"), 4)
    assert result.rule_id == "PROB-S9"  # 2*2+3+2
    assert result.decision_path[-1]["sum"] == 9
    assert result.decision_path[-1]["final_score"] == 4


def test_engine_source_is_pure():
    src = (
        pathlib.Path(__file__)
        .parent.parent.joinpath("app", "services", "probability.py")
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
