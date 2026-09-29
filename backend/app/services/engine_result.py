"""Shared types for the RAVEN Layer 3 deterministic engines."""

from dataclasses import dataclass

RULE_VERSION = "3.0.0"


@dataclass(frozen=True)
class EngineResult:
    """What every engine returns and what gets stored in risk_assessments."""

    score: int  # 1-5
    rule_id: str  # e.g. "SEV-R4", "PROB-S9", "DET-S4"
    rule_version: str  # from the active rule config snapshot
    decision_path: list  # ordered list of evaluated conditions (dicts)
    reasoning: str  # non-empty human-readable text, built from templates
