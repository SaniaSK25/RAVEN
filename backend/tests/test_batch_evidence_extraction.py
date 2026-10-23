import pytest
from langchain_core.runnables import RunnableLambda
from pydantic import ValidationError

from app.agents.agent_analyzer import (
    extract_evidence_batch,
)
from app.schemas.evidence import EvidenceRecord


def _evidence_data():
    boolean_fields = (
        "patient_safety",
        "product_quality",
        "batch_release",
        "data_integrity",
        "regulatory_compliance",
        "business_continuity",
    )
    probability_fields = (
        "functional_complexity",
        "dependency_complexity",
        "workflow_complexity",
    )
    detectability_fields = (
        "detection_controls",
        "traceability",
        "failure_visibility",
    )
    return {
        "gamp_category": 4,
        "gamp_reason": "Configured functionality.",
        "severity": {
            name: {"value": False, "confidence": 0.9, "evidence": "Not stated."}
            for name in boolean_fields
        },
        "probability": {
            name: {"value": "LOW", "confidence": 0.8, "evidence": "Simple."}
            for name in probability_fields
        },
        "detectability": {
            name: {"value": "HIGH", "confidence": 0.8, "evidence": "Visible."}
            for name in detectability_fields
        },
    }


def _batch_output(requirement_ids):
    return {
        "items": [
            {
                "id": requirement_id,
                "gamp": 4,
                "reason": "Configured system",
                "sev": [[False, 0.9, "Not stated"]] * 6,
                "prob": [["LOW", 0.8, "Simple"]] * 3,
                "det": [["HIGH", 0.8, "Visible"]] * 3,
            }
            for requirement_id in requirement_ids
        ]
    }


class _FakeBatchLLM:
    model_id = "fake-batch-model"

    def __init__(self, response):
        self.response = response
        self.call_count = 0
        self.prompt = None

    def with_structured_output(self, schema):
        return RunnableLambda(lambda prompt: self._invoke(prompt, schema))

    def _invoke(self, prompt, schema):
        self.call_count += 1
        self.prompt = prompt
        return schema.model_validate(self.response)


def test_batch_extraction_maps_complete_records_with_one_model_call(monkeypatch):
    import app.agents.agent_analyzer as analyzer

    requirement_ids = ["REQ-1", "REQ-2"]
    fake_llm = _FakeBatchLLM(_batch_output(requirement_ids))
    usage_log = []
    llm_options = {}
    monkeypatch.setattr(
        analyzer,
        "get_llm",
        lambda **kwargs: (llm_options.update(kwargs) or fake_llm),
    )

    records = extract_evidence_batch(
        [(requirement_id, f"Text for {requirement_id}") for requirement_id in requirement_ids],
        usage_log=usage_log,
    )

    assert list(records) == requirement_ids
    assert all(record.gamp_category == 4 for record in records.values())
    assert all(record.severity.patient_safety.value is False for record in records.values())
    assert all(
        record.detectability.traceability.value == "HIGH"
        for record in records.values()
    )
    assert fake_llm.call_count == 1
    prompt = fake_llm.prompt.to_messages()[0].content
    assert "one complete, grammatical explanatory sentence" in prompt
    assert "normally 8-12 words" in prompt
    assert "at most 3 words" not in fake_llm.prompt.to_messages()[0].content
    assert llm_options == {"max_tokens": 8192}
    assert len(usage_log) == 1
    assert usage_log[0]["group"] == "BatchEvidenceRecord"


def test_batch_extraction_does_not_retry_or_fallback_for_missing_items(monkeypatch):
    import app.agents.agent_analyzer as analyzer

    output = _batch_output(["REQ-1"])
    fake_llm = _FakeBatchLLM(output)
    monkeypatch.setattr(analyzer, "get_llm", lambda **_kwargs: fake_llm)

    with pytest.raises(ValueError, match="omitted requirement IDs"):
        extract_evidence_batch(
            [
                ("REQ-1", "first requirement"),
                ("REQ-2", "second requirement"),
                ("REQ-3", "third requirement"),
            ]
        )

    assert fake_llm.call_count == 1


def test_batch_extraction_does_not_retry_or_fallback_for_invalid_evidence(monkeypatch):
    import app.agents.agent_analyzer as analyzer

    fake_llm = _FakeBatchLLM('{"items":[{"id":"REQ-1"}]}')
    monkeypatch.setattr(analyzer, "get_llm", lambda **_kwargs: fake_llm)

    with pytest.raises(ValidationError):
        extract_evidence_batch([("REQ-1", "requirement")])

    assert fake_llm.call_count == 1


def test_batch_extraction_rejects_invalid_structured_output_after_one_call(monkeypatch):
    import app.agents.agent_analyzer as analyzer

    fake_llm = _FakeBatchLLM({"items": [{"id": "REQ-1"}]})
    monkeypatch.setattr(analyzer, "get_llm", lambda **_kwargs: fake_llm)

    with pytest.raises(ValidationError):
        extract_evidence_batch([("REQ-1", "requirement")])

    assert fake_llm.call_count == 1


def test_batch_extraction_rejects_unknown_requirement_ids(monkeypatch):
    import app.agents.agent_analyzer as analyzer

    fake_llm = _FakeBatchLLM(_batch_output(["UNKNOWN"]))
    monkeypatch.setattr(analyzer, "get_llm", lambda **_kwargs: fake_llm)

    with pytest.raises(ValueError, match="unknown requirement ID"):
        extract_evidence_batch([("REQ-1", "text")])


def test_evidence_schema_allows_explanatory_sentences():
    evidence = _evidence_data()
    evidence["severity"]["patient_safety"]["evidence"] = (
        "The requirement validates mandatory information before registration, "
        "preventing incomplete sample records from entering the system."
    )
    assert EvidenceRecord.model_validate(evidence).severity.patient_safety.evidence

    evidence = _evidence_data()
    evidence["severity"]["patient_safety"]["evidence"] = "x" * 241
    with pytest.raises(ValueError):
        EvidenceRecord.model_validate(evidence)

    evidence = _evidence_data()
    evidence["gamp_reason"] = "x" * 161
    with pytest.raises(ValueError):
        EvidenceRecord.model_validate(evidence)


@pytest.mark.parametrize(
    "requirements",
    [
        [],
        [(f"REQ-{index}", "text") for index in range(11)],
        [("REQ-1", "first"), ("REQ-1", "second")],
    ],
)
def test_batch_extraction_validates_size_and_unique_ids(monkeypatch, requirements):
    import app.agents.agent_analyzer as analyzer

    monkeypatch.setattr(
        analyzer, "get_llm", lambda **_kwargs: pytest.fail("LLM must not run")
    )
    with pytest.raises(ValueError):
        extract_evidence_batch(requirements)
