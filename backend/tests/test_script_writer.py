"""Script-writer tests: schema, gating, retry (LLM faked, no AWS)."""

from unittest.mock import patch

import pytest
from langchain_core.runnables import RunnableLambda
from pydantic import ValidationError

from app.agents.agent_script_writer import (
    generate_test_script,
    is_generation_required,
)
from app.models.models import TestScript as ScriptModel

SCRIPT = {
    "preconditions": "User is registered in the system.",
    "steps": [
        {
            "step_number": 1,
            "action": "Register a sample.",
            "expected_result": "ID assigned.",
        },
        {
            "step_number": 2,
            "action": "Re-register the same sample.",
            "expected_result": "Reuse is rejected.",
        },
    ],
}
EXPECTED = ScriptModel(**SCRIPT)


class FakeLLM:
    model_id = "fake-model"

    def __init__(self, fail_times=0):
        self.calls = 0
        self.fail_times = fail_times

    def with_structured_output(self, schema):
        def _invoke(_prompt_value):
            self.calls += 1
            if self.calls <= self.fail_times:
                raise ValidationError.from_exception_data(
                    "TestScript",
                    [{"type": "missing", "loc": ("steps",), "input": {}}],
                )
            return EXPECTED

        return RunnableLambda(_invoke)


def test_gate_allows_scripted_only():
    assert is_generation_required({"generate_test": True}) is True
    assert is_generation_required({"generate_test": False}) is False
    assert is_generation_required({}) is False


def test_generates_steps_and_logs_usage():
    usage_log: list = []
    with patch("app.agents.agent_script_writer.get_llm", return_value=FakeLLM()):
        result = generate_test_script("The system shall do X.", usage_log=usage_log)
    assert len(result.steps) == 2
    assert result.steps[0].expected_result == "ID assigned."
    assert [u["group"] for u in usage_log] == ["TestScript"]
    assert usage_log[0]["ok"] is True


def test_retry_recovers_and_persistent_failure_reraises():
    with patch(
        "app.agents.agent_script_writer.get_llm", return_value=FakeLLM(fail_times=1)
    ):
        assert generate_test_script("The system shall do X.") == EXPECTED
    bad = FakeLLM(fail_times=99)
    with (
        patch("app.agents.agent_script_writer.get_llm", return_value=bad),
        pytest.raises(ValidationError),
    ):
        generate_test_script("The system shall do X.", max_retries=2)
    assert bad.calls == 3


def test_empty_steps_rejected():
    with pytest.raises(ValidationError):
        ScriptModel(preconditions="Ready.", steps=[])
