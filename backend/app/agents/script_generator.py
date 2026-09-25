from __future__ import annotations

from typing import ClassVar

from app.agents.base import PlaceholderAgent


class TestScriptGenerator(PlaceholderAgent):
    """Agent 2 - test script generator.

    Drafts preconditions, steps, expected results and acceptance criteria for the
    requirements that the *assurance engine* marked Scripted. It never decides which
    requirements get a script, and it never runs for exploratory or unscripted
    decisions.
    """

    name = "agent-2-test-script-generator"
    version = "0.1.0"
    purpose = (
        "Draft a test script for a Scripted assurance decision: preconditions, "
        "steps, expected results and acceptance criteria, each linked to the "
        "requirement and risk it verifies."
    )
    request_model = "AgentAnalyzeIn"
    response_model = "TestScriptCreateIn"
    placeholder_service = "app.agents.script_generator.TestScriptGenerator"
    ingest_endpoint = "POST /api/v1/tests"
    notes = (
        "Exploratory decisions already receive a deterministic charter from a template "
        "and unscripted decisions already receive a supplier leverage / ad hoc record "
        "generated from the rule that fired. Agent 2 must not create those: generating "
        "scripts for unscripted requirements is the exact failure mode CSA warns about."
    )

    inputs: ClassVar[dict[str, str]] = {
        "assurance": "GET /api/v1/assurance?level=scripted (decisions without tests yet)",
        "risk": "GET /api/v1/risk/{risk_id} (failure_scenario, severity, probability, detectability, rpn)",
        "requirement": "GET /api/v1/requirements/{requirement_id} (versioned text)",
        "evidence": "GET /api/v1/evidence?requirement_id=... (frozen indicators that drove the risk)",
        "decision_path": "Decision path and rule version stored on the assurance decision",
    }
    outputs: ClassVar[dict[str, str]] = {
        "script": (
            "TestScriptCreateIn: title, preconditions, steps, expected_results, "
            "acceptance_criteria, rationale, requirement_ids, risk_id, assurance_id"
        ),
        "traceability": "The POST creates the test -> requirement and assurance -> test edges automatically",
    }
    steps = (
        "List assurance decisions with level=scripted that have no tests linked yet.",
        "Load the linked risk, its frozen evidence and the requirement version text.",
        "Draft steps that exercise the recorded failure scenario, not generic boilerplate.",
        "State expected results and acceptance criteria that a reviewer can pass or fail unambiguously.",
        "POST each script to /api/v1/tests with risk_id, assurance_id and at least one requirement_id.",
        "Re-run GET /api/v1/traceability/orphans and confirm no new O3 (scripted risk with zero tests) appears.",
    )
    must_not = (
        "Decide which requirements are scripted - that is rules R1-R6 in the assurance engine.",
        "Generate scripts for exploratory or unscripted decisions.",
        "Create or edit supplier leverage records.",
        "Change a requirement version or a risk score.",
        "Leave a script unlinked from its requirement and risk (that creates an orphan).",
    )
    determinism = (
        "The set of generated scripts is determined by the assurance engine, not the model. "
        "Only the wording of the script is LLM assisted, and the link to the requirement and "
        "risk is enforced by the API, which keeps traceability intact."
    )
    settings: ClassVar[dict[str, str]] = {
        "auto_create_charters": "When true the assurance engine already created exploratory charters.",
    }
