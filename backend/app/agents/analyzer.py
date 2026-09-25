from __future__ import annotations

from typing import Any, ClassVar

from app.agents.base import PlaceholderAgent


class RequirementAnalyzer(PlaceholderAgent):
    """Agent 1 - requirement analyzer (evidence extraction).

    Reads one requirement version and extracts *facts*: severity indicators, GxP
    indicators, complexity levels, detectability levels, GAMP category and failure
    scenarios. It never assigns severity, probability, detectability, RPN or an
    assurance level; those come from the deterministic engines in ``app.engines``.
    """

    name = "agent-1-requirement-analyzer"
    version = "0.1.0"
    purpose = (
        "Read a requirement and emit factual evidence indicators with a confidence "
        "value and a quoted evidence sentence per field. Never assigns a score."
    )
    request_model = "AgentAnalyzeIn"
    response_model = "EvidenceCreateIn"
    placeholder_service = "app.agents.analyzer.RequirementAnalyzer"
    ingest_endpoint = "POST /api/v1/evidence"
    notes = (
        "Output is stored as a DRAFT evidence record. A human freezes it (or the QA "
        "review queue resolves low confidence fields first); the deterministic engines "
        "read frozen evidence only, so re-running the agent can never move a decision "
        "that has already been made from frozen evidence."
    )

    inputs: ClassVar[dict[str, str]] = {
        "requirement": "GET /api/v1/requirements/{requirement_id} (text, req_key, version)",
        "rubric": "Written rating rubric: 2-3 worked examples per LOW/MEDIUM/HIGH rating",
        "field_registry": "app.utils.evidence_fields.SPECS (allowed fields, kinds, enums)",
        "clause_registry": "GET /api/v1/compliance/clauses (optional GxP context)",
    }
    outputs: ClassVar[dict[str, str]] = {
        "fields": (
            "One entry per evidence field: field_name, value, confidence, evidence_text "
            "(the sentence from the requirement text that justifies the value)"
        ),
        "provenance": "extractor, model_version, prompt_version stored on the record",
    }
    steps = (
        "Load the active requirement version and its text.",
        "Call the model at temperature 0 with enum constrained structured output and the rating rubric.",
        "For each field, quote the sentence that justifies the value; leave omissions empty rather than guessing.",
        "Validate every field against app.utils.evidence_fields.SPECS.",
        "POST the payload to /api/v1/evidence with replace_existing=true as a draft.",
        "Stop. Freezing evidence and QA review are human actions; Agent 1 never freezes.",
    )
    must_not = (
        "Assign severity, probability, detectability, RPN, risk band or assurance level.",
        "Decide which requirements need a test script.",
        "Freeze or supersede evidence records, or edit frozen evidence.",
        "Write to the risks, assurance_decisions or test_scripts tables.",
        "Invent an indicator that the requirement text does not support.",
    )
    determinism = (
        "LLM assisted and therefore reproducible rather than strictly deterministic: "
        "temperature 0, constrained structured output, stored model and prompt versions, "
        "freeze rule, and mandatory QA review of fields below the confidence threshold."
    )
    settings: ClassVar[dict[str, str]] = {
        "qa_confidence_threshold": "Fields below this confidence go to the QA review queue.",
        "require_qa_review_before_freeze": "When true, freeze is refused until low confidence fields are reviewed.",
    }

    def rating_rubric(self) -> dict[str, Any]:
        """The rubric the prompt must embed so ratings stay consistent between runs.

        Example guidance for ``functional_complexity``: LOW is a simple field or
        lookup, MEDIUM is a business rule or calculation, HIGH is multi branch logic
        or custom code. When the requirement text is silent about a detectability
        factor, rate LOW or MEDIUM and let the QA queue flag it.
        """
        return {
            "levels": ["LOW", "MEDIUM", "HIGH"],
            "coverage": [
                "functional_complexity",
                "dependency_complexity",
                "workflow_complexity",
                "detection_controls",
                "traceability",
                "failure_visibility",
            ],
            "principle": (
                "'Impacts X' means DIRECT impact, otherwise nearly every LIMS requirement "
                "flags data integrity and product quality and severity saturates."
            ),
            "silence_rule": (
                "When the text does not state whether automated controls or visible errors "
                "exist, rate LOW or MEDIUM and flag the field for QA review."
            ),
        }
