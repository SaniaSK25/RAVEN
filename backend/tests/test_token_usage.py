"""Token usage collection (no AWS).

Proves: TokenCollector sums usage_metadata across generations and tolerates
missing data; extract_evidence logs one entry per group call without
changing the returned record.
"""

from unittest.mock import patch

from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, LLMResult
from langchain_core.runnables import RunnableLambda

from app.agents.agent_analyzer import extract_evidence
from app.agents.bedrock_config import TokenCollector
from app.models.evidence import (
    DetectabilityEvidence,
    GampClassification,
    ProbabilityEvidence,
    SeverityEvidence,
)


def _result_with_usage(input_tokens, output_tokens):
    msg = AIMessage(
        content="ok",
        usage_metadata={
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
        },
    )
    return LLMResult(generations=[[ChatGeneration(message=msg)]])


def test_collector_sums_across_generations():
    collector = TokenCollector()
    collector.on_llm_end(_result_with_usage(100, 20))
    collector.on_llm_end(_result_with_usage(50, 5))
    assert collector.totals() == {
        "input_tokens": 150,
        "output_tokens": 25,
        "total_tokens": 175,
    }


def test_collector_tolerates_missing_metadata():
    collector = TokenCollector()
    msg = AIMessage(content="no usage attached")
    collector.on_llm_end(LLMResult(generations=[[ChatGeneration(message=msg)]]))
    assert collector.totals() == {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
    }


SEV = {
    name: {"value": False, "confidence": 0.9, "evidence": "Not stated."}
    for name in (
        "patient_safety",
        "product_quality",
        "batch_release",
        "data_integrity",
        "regulatory_compliance",
        "business_continuity",
    )
}
PROB = {
    name: {"value": "LOW", "confidence": 0.8, "evidence": "Simple."}
    for name in (
        "functional_complexity",
        "dependency_complexity",
        "workflow_complexity",
    )
}
DET = {
    name: {"value": "HIGH", "confidence": 0.8, "evidence": "Visible."}
    for name in ("detection_controls", "traceability", "failure_visibility")
}

FIXTURES = {
    SeverityEvidence: SeverityEvidence(**SEV),
    ProbabilityEvidence: ProbabilityEvidence(**PROB),
    DetectabilityEvidence: DetectabilityEvidence(**DET),
    GampClassification: GampClassification(
        gamp_category=4, gamp_reason="Configured LIMS."
    ),
}


class FakeLLM:
    model_id = "fake-model"

    def with_structured_output(self, schema):
        return RunnableLambda(lambda _prompt_value: FIXTURES[schema])


def test_usage_log_has_one_entry_per_group():
    usage_log: list = []
    with patch("app.agents.agent_analyzer.get_llm", return_value=FakeLLM()):
        record = extract_evidence("The system shall do X.", usage_log=usage_log)
    assert record.gamp_category == 4  # record itself unchanged
    assert [u["group"] for u in usage_log] == [
        "SeverityEvidence",
        "ProbabilityEvidence",
        "DetectabilityEvidence",
        "GampClassification",
    ]
    assert all(u["ok"] for u in usage_log)
    assert all(u["model"] == "fake-model" for u in usage_log)
