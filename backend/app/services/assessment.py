"""RAVEN Layer 3 — full assessment wiring (Phase D).

Runs the three engines over one frozen EvidenceRecord and joins them
with RPN + band. Pure and deterministic: the only LLM step (extraction)
happens before this function is ever called.
"""

from dataclasses import asdict

from app.models.evidence import EvidenceRecord
from app.services.assurance import decide_assurance
from app.services.detectability import calculate_detectability
from app.services.probability import calculate_probability
from app.services.rpn import calculate_rpn
from app.services.severity import calculate_severity


def assess_evidence(record: EvidenceRecord) -> dict:
    severity = calculate_severity(record.severity)
    probability = calculate_probability(record.probability, record.gamp_category)
    detectability = calculate_detectability(record.detectability)
    outcome = calculate_rpn(severity.score, probability.score, detectability.score)
    assurance = decide_assurance(severity.score, outcome["band"])
    return {
        "gamp_category": record.gamp_category,
        "gamp_reason": record.gamp_reason,
        "severity": asdict(severity),
        "probability": asdict(probability),
        "detectability": asdict(detectability),
        "rpn": outcome["rpn"],
        "rpn_points": outcome["rpn_points"],
        "band": outcome["band"],
        "assurance": assurance,
    }
