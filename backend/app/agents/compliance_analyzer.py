from __future__ import annotations

from typing import ClassVar

from app.agents.base import PlaceholderAgent


class ComplianceAnalyzer(PlaceholderAgent):
    """Agent 3 - compliance analyzer (hybrid: AI matches, rules decide).

    For each atomic clause criterion, judge which requirement (if any) satisfies it
    and cite the requirement ID. Coverage status per clause is then computed
    deterministically by the compliance service, not by the model.
    """

    name = "agent-3-compliance-analyzer"
    version = "0.1.0"
    purpose = (
        "Match requirement versions to atomic clause criteria and cite the requirement "
        "IDs that satisfy each criterion. Never decides covered / partial / absent."
    )
    request_model = "AgentAnalyzeIn"
    response_model = "MatchesBulkIn"
    placeholder_service = "app.agents.compliance_analyzer.ComplianceAnalyzer"
    ingest_endpoint = "POST /api/v1/compliance/assessments/{assessment_id}/matches"
    notes = (
        "Bias toward recall: a missed criterion costs more than a false flag, because a "
        "false flag sends a reviewer to a clause they can dismiss, while a miss ships a "
        "silent gap. A criterion that no requirement satisfies is a legitimate answer."
    )

    inputs: ClassVar[dict[str, str]] = {
        "clauses": "GET /api/v1/compliance/clauses (clause_ref, title, theme, atomic criteria)",
        "criteria": "criterion_id + criterion text, one row per atomic criterion",
        "requirements": "GET /api/v1/requirements?status=active (versioned requirement text)",
        "themes": "Audit trail, e-signature, access control, record retention, data integrity",
    }
    outputs: ClassVar[dict[str, str]] = {
        "matches": (
            "MatchesBulkIn: one entry per criterion with status (met/not_met), "
            "requirement_ids (the citations), citation, confidence and method"
        ),
        "assessment": "Set complete=true on the final batch to close the assessment",
    }
    steps = (
        "Create an assessment: POST /api/v1/compliance/assessments.",
        "Load every clause with its atomic criteria and every active requirement.",
        "For each criterion, judge independently which requirement satisfies it and cite its ID.",
        "Emit status=not_met with no citations when nothing satisfies the criterion; do not fabricate coverage.",
        "POST the batches to /api/v1/compliance/assessments/{id}/matches with method='ai'.",
        "Call POST /api/v1/compliance/assessments/{id}/report for the deterministic coverage rollup and gaps.",
    )
    must_not = (
        "Decide Covered / Partially covered / Absent - the compliance service computes that from the matches.",
        "Invent clause text, criterion text or clause references. The registry is static and authoritative.",
        "Mark a criterion met without citing a requirement ID.",
        "Edit the clause registry or delete criteria.",
    )
    determinism = (
        "The model only proposes matches and citations. Status per criterion is a stored "
        "fact, and the clause rollup is a deterministic function of those stored facts, so "
        "the same match set always produces the same coverage report."
    )
    settings: ClassVar[dict[str, str]] = {
        "bias": "Recall over precision: prefer citing a requirement to silently dropping a criterion.",
    }
