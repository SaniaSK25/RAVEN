"""Retry + assembly behaviour of extract_evidence (LLM faked, no AWS).

Proves: 4 per-group extractions assemble into one EvidenceRecord; a
ValidationError on one group is retried with feedback; persistent failure
re-raises after exhausting retries.
"""

from unittest.mock import patch

import pytest
from langchain_core.runnables import RunnableLambda
from pydantic import ValidationError

from app.agents.agent_analyzer import extract_evidence
from app.models.evidence import (
    DetectabilityEvidence,
    GampClassification,
    ProbabilityEvidence,
    SeverityEvidence,
)

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
GAMP = {"gamp_category": 4, "gamp_reason": "Configured LIMS."}

FIXTURES = {
    SeverityEvidence: SeverityEvidence(**SEV),
    ProbabilityEvidence: ProbabilityEvidence(**PROB),
    DetectabilityEvidence: DetectabilityEvidence(**DET),
    GampClassification: GampClassification(**GAMP),
}

MISSING_FIELD = ValidationError.from_exception_data(
    "Group",
    [{"type": "missing", "loc": ("traceability",), "input": {}}],
)


class FakeLLM:
    """Fails the first `fail_times` group calls, then returns per-schema
    fixtures. Counts every structured invocation."""

    def __init__(self, fail_times=1):
        self.calls = 0
        self.fail_times = fail_times

    def with_structured_output(self, schema):
        def _invoke(_prompt_value):
            self.calls += 1
            if self.calls <= self.fail_times:
                raise MISSING_FIELD
            return FIXTURES[schema]

        return RunnableLambda(_invoke)


def test_groups_assemble_into_record_with_retry():
    fake = FakeLLM(fail_times=1)
    with patch("app.agents.agent_analyzer.get_llm", return_value=fake):
        result = extract_evidence("The system shall do X.")
    assert result.gamp_category == 4
    assert result.severity.business_continuity.value is False
    assert result.probability.workflow_complexity.value == "LOW"
    assert result.detectability.traceability.value == "HIGH"
    assert fake.calls == 5  # 1 failed + 1 retried + 3 remaining groups


def test_persistent_failure_reraises():
    fake = FakeLLM(fail_times=99)
    with (
        patch("app.agents.agent_analyzer.get_llm", return_value=fake),
        pytest.raises(ValidationError),
    ):
        extract_evidence("The system shall do X.", max_retries=2)
    assert fake.calls == 3  # 1 try + 2 retries on the first group
