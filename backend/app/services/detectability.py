"""RAVEN Layer 3 — Engine 3: Detectability.

Point-sum over the three detectability fields with INVERTED polarity:
better detection earns FEWER points (HIGH=0, MEDIUM=1, LOW=2), so a low
score means "easily detected" and a high score means "nearly invisible".
Pure function: no LLM, no DB, no network, no clock.
"""

from app.models.evidence import DetectabilityEvidence
from app.services.engine_result import RULE_VERSION, EngineResult

POINTS = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}

SUM_TO_SCORE = {0: 1, 1: 2, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5}


def calculate_detectability(
    evidence: DetectabilityEvidence, controls_floor: int | None = None
) -> EngineResult:
    c = POINTS[evidence.detection_controls.value]
    t = POINTS[evidence.traceability.value]
    v = POINTS[evidence.failure_visibility.value]
    total = c + t + v
    mapped = SUM_TO_SCORE[total]
    floor_applied = (
        controls_floor is not None and evidence.detection_controls.value != "HIGH"
    )
    final = max(mapped, controls_floor) if floor_applied else mapped

    path = [
        {
            "check": "detection_controls",
            "result": evidence.detection_controls.value,
            "points": c,
            "evidence": evidence.detection_controls.evidence,
        },
        {
            "check": "traceability",
            "result": evidence.traceability.value,
            "points": t,
            "evidence": evidence.traceability.evidence,
        },
        {
            "check": "failure_visibility",
            "result": evidence.failure_visibility.value,
            "points": v,
            "evidence": evidence.failure_visibility.evidence,
        },
        {
            "check": "computation",
            "sum": total,
            "mapped_score": mapped,
            "controls_floor": controls_floor,
            "floor_applied": floor_applied,
            "final_score": final,
        },
    ]
    return EngineResult(
        score=final,
        rule_id=f"DET-S{total}",
        rule_version=RULE_VERSION,
        decision_path=path,
        reasoning=_reasoning(evidence, total, final, controls_floor, floor_applied),
    )


def _reasoning(evidence, total, final, controls_floor, floor_applied) -> str:
    text = (
        f"Detectability {final}: detection controls "
        f"{evidence.detection_controls.value}, traceability "
        f"{evidence.traceability.value}, failure visibility "
        f"{evidence.failure_visibility.value} give point sum {total} "
        f"(higher sum = harder to detect), which maps to {final} "
        f"(1 = easily detected, 5 = hard to detect)."
    )
    if floor_applied:
        text += (
            f" Controls floor of {controls_floor} applied because detection "
            f"controls are not HIGH."
        )
    text += (
        " Supporting evidence: detection_controls: "
        f"{evidence.detection_controls.evidence} | traceability: "
        f"{evidence.traceability.evidence} | failure_visibility: "
        f"{evidence.failure_visibility.evidence}"
    )
    return text
