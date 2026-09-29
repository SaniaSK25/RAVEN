"""RAVEN Layer 3 — Engine 1: Severity.

First-match rule tree over the six boolean severity flags. Pure function:
no LLM, no DB, no network, no clock. Rules evaluate strictly in order;
the first match wins and the decision path stops there.
"""

from app.models.evidence import SeverityEvidence
from app.services.engine_result import RULE_VERSION, EngineResult

TEMPLATES = {
    "SEV-R1": "Severity 5: failure may directly affect patient safety.",
    "SEV-R2": (
        "Severity 5: failure affects product quality and participates "
        "in batch disposition or release decisions."
    ),
    "SEV-R3": (
        "Severity 4: failure affects product quality without direct "
        "batch release impact."
    ),
    "SEV-R4": (
        "Severity 4: failure compromises both data integrity and regulatory compliance."
    ),
    "SEV-R5": (
        "Severity 3: failure affects data integrity or regulatory "
        "compliance, but not both."
    ),
    "SEV-R6": (
        "Severity 2: failure would interrupt laboratory operations without "
        "affecting quality, data integrity, or compliance."
    ),
    "SEV-R7": (
        "Severity 1: no impact beyond convenience or cosmetic behaviour was identified."
    ),
}


def calculate_severity(evidence: SeverityEvidence) -> EngineResult:
    path: list = []

    def flag(name: str) -> bool:
        field = getattr(evidence, name)
        path.append({"check": name, "result": field.value, "evidence": field.evidence})
        return field.value

    rule_id = ""
    score = 0
    if flag("patient_safety"):
        rule_id, score = "SEV-R1", 5
    elif flag("product_quality"):
        if flag("batch_release"):
            rule_id, score = "SEV-R2", 5
        else:
            rule_id, score = "SEV-R3", 4
    else:
        data_integrity = flag("data_integrity")
        regulatory = flag("regulatory_compliance")
        if data_integrity and regulatory:
            rule_id, score = "SEV-R4", 4
        elif data_integrity or regulatory:
            # Effectively "exactly one": R4 above eliminated both-true.
            rule_id, score = "SEV-R5", 3
        elif flag("business_continuity"):
            rule_id, score = "SEV-R6", 2
        else:
            rule_id, score = "SEV-R7", 1

    return EngineResult(
        score=score,
        rule_id=rule_id,
        rule_version=RULE_VERSION,
        decision_path=path,
        reasoning=_reasoning(rule_id, path),
    )


def _reasoning(rule_id: str, path: list) -> str:
    raised = [e for e in path if e["result"] is True]
    if not raised:
        return TEMPLATES[rule_id] + " No severity impact flags were raised."
    suffix = " | ".join(f"{e['check']}: {e['evidence']}" for e in raised)
    return TEMPLATES[rule_id] + f" Supporting evidence: {suffix}"
