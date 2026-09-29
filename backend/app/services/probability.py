"""RAVEN Layer 3 — Engine 2: Probability.

Weighted-sum formula over the three complexity fields. Functional
complexity counts double (most direct driver of implementation failure).
Pure function: no LLM, no DB, no network, no clock.
"""

from app.models.evidence import ProbabilityEvidence
from app.services.engine_result import RULE_VERSION, EngineResult

POINTS = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}

SUM_TO_SCORE = {4: 1, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4, 11: 4, 12: 5}

# Default GAMP modifier: zero for every category unless a team explicitly
# configures an uplift (e.g. +1 for custom Category 5 code).
GAMP_MODIFIER = {1: 0, 3: 0, 4: 0, 5: 0}


def calculate_probability(
    evidence: ProbabilityEvidence,
    gamp_category: int,
    modifier: dict | None = None,
) -> EngineResult:
    table = GAMP_MODIFIER if modifier is None else modifier

    def points(level: str) -> int:
        return POINTS[level]

    f = points(evidence.functional_complexity.value)
    d = points(evidence.dependency_complexity.value)
    w = points(evidence.workflow_complexity.value)
    total = 2 * f + d + w
    mapped = SUM_TO_SCORE[total]
    uplift = table.get(gamp_category, 0)
    final = min(5, max(1, mapped + uplift))

    path = [
        {
            "check": "functional_complexity",
            "result": evidence.functional_complexity.value,
            "points": f,
            "weight": 2,
            "weighted": 2 * f,
            "evidence": evidence.functional_complexity.evidence,
        },
        {
            "check": "dependency_complexity",
            "result": evidence.dependency_complexity.value,
            "points": d,
            "weight": 1,
            "weighted": d,
            "evidence": evidence.dependency_complexity.evidence,
        },
        {
            "check": "workflow_complexity",
            "result": evidence.workflow_complexity.value,
            "points": w,
            "weight": 1,
            "weighted": w,
            "evidence": evidence.workflow_complexity.evidence,
        },
        {
            "check": "computation",
            "sum": total,
            "mapped": mapped,
            "gamp_category": gamp_category,
            "gamp_modifier": uplift,
            "final_score": final,
        },
    ]
    return EngineResult(
        score=final,
        rule_id=f"PROB-S{total}",
        rule_version=RULE_VERSION,
        decision_path=path,
        reasoning=_reasoning(evidence, total, mapped, gamp_category, uplift, final),
    )


def _reasoning(evidence, total, mapped, gamp_category, uplift, final) -> str:
    text = (
        f"Probability {final}: functional complexity "
        f"{evidence.functional_complexity.value}, dependency complexity "
        f"{evidence.dependency_complexity.value}, workflow complexity "
        f"{evidence.workflow_complexity.value} give weighted sum {total} "
        f"(formula: 2xF + D + W = {total}), which maps to {mapped}."
    )
    if uplift:
        text += (
            f" GAMP category {gamp_category} modifier {uplift:+d} applied, "
            f"giving final score {final}."
        )
    text += (
        " Supporting evidence: functional_complexity: "
        f"{evidence.functional_complexity.evidence} | dependency_complexity: "
        f"{evidence.dependency_complexity.evidence} | workflow_complexity: "
        f"{evidence.workflow_complexity.evidence}"
    )
    return text
