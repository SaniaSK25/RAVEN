"""Pipeline test for a real requirement, with the LLM mocked.

Requirement under test (sample identity):
    The system shall assign a unique sample identifier to each sample
    registered in the system and shall prevent reuse of the identifier
    across active and archived sample.

Why mocked? The IAM policy currently denies Bedrock InvokeModel/List calls
for this user, and unit tests must never depend on live AWS anyway.
We fake ONLY the LLM step; the rule engine runs for real.
"""

from unittest.mock import patch

from langchain_core.runnables import RunnableLambda

from app.agents.agent_analyzer import analyze_requirement
from app.models.models import RequirementAnalysis
from app.services.rule_engine import calculate_risk

SAMPLE_REQUIREMENT = (
    "The system shall assign a unique sample identifier to each sample "
    "registered in the system and shall prevent reuse of the identifier "
    "across active and archived sample."
)

# What a competent analyzer SHOULD return for this requirement:
# sample mix-up threatens patient safety / product quality -> GxP True,
# severity High (wrong-sample result), probability Medium (reuse possible
# if not enforced), detectability Low (mislabeled sample is hard to catch).
FAKE_ANALYSIS = RequirementAnalysis(
    gamp_category="Category 4",
    gamp_rationale="Configured LIMS functionality for sample registration.",
    gxp_impact=True,
    gxp_rationale="Sample mix-up directly impacts patient safety and data integrity.",
    severity_fact="A reused identifier can link results to the wrong patient or batch.",
    probability_fact="Reuse is possible across active and archived stores if not enforced.",
    detectability_fact="A wrongly linked result is hard to detect before clinical action.",
    severity_level="High",
    probability_level="Medium",
    detectability_level="Low",
)


class FakeLLM:
    """Stands in for ChatBedrock. Only fakes with_structured_output;
    the prompt chain (prompt | structured_llm) runs for real."""

    def with_structured_output(self, schema):
        assert schema is RequirementAnalysis
        return RunnableLambda(lambda prompt_value: FAKE_ANALYSIS)


def test_sample_id_pipeline():
    with patch(
        "app.agents.agent_analyzer.get_llm", return_value=FakeLLM()
    ):
        analysis = analyze_requirement(SAMPLE_REQUIREMENT)

    assert analysis.gxp_impact is True
    assert analysis.severity_level == "High"

    risk = calculate_risk(analysis)  # REAL rule engine, no mock
    print("\nANALYSIS:\n" + analysis.model_dump_json(indent=2))
    print("\nRISK:\n" + str(risk))

    # High(4) x Medium(2) x Low(3) = 24 -> HIGH
    assert risk["total_risk_score"] == 24
    assert risk["risk_band"] == "HIGH"
