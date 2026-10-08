"""Script-writer tests: split calls, gating, retry (LLM faked, no AWS)."""

from unittest.mock import patch

import pytest
from langchain_core.runnables import RunnableLambda
from pydantic import ValidationError

from app.agents.agent_script_writer import (
    generate_test_script,
    is_generation_required,
)
from app.models.models import (
    ScriptPreconditions as PreconditionsModel,
)
from app.models.models import (
    ScriptSteps as StepsModel,
)
from app.models.models import (
    TestScript as ScriptModel,
)

PRE = {"preconditions": "User is registered in the system."}
STEPS = {
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
    ]
}
FIXTURES = {
    PreconditionsModel: PreconditionsModel(**PRE),
    StepsModel: StepsModel(**STEPS),
}


class FakeLLM:
    model_id = "fake-model"

    def __init__(self, fail_schema=None, fail_times=0):
        self.calls: list = []
        self.fail_schema = fail_schema
        self.fail_times = fail_times

    def with_structured_output(self, schema):
        def _invoke(_prompt_value):
            self.calls.append(schema.__name__)
            n_same = self.calls.count(schema.__name__)
            if schema is self.fail_schema and n_same <= self.fail_times:
                raise ValidationError.from_exception_data(
                    schema.__name__,
                    [{"type": "missing", "loc": ("steps",), "input": {}}],
                )
            return FIXTURES[schema]

        return RunnableLambda(_invoke)


def _scripted():
    return {"assurance_level": "scripted", "generate_test": True}


def test_gate_allows_scripted_only():
    assert is_generation_required({"generate_test": True}) is True
    assert is_generation_required({"generate_test": False}) is False
    assert is_generation_required({}) is False


def test_split_calls_assemble_and_log_usage():
    usage_log: list = []
    with patch("app.agents.agent_script_writer.get_llm", return_value=FakeLLM()):
        result = generate_test_script(
            "The system shall do X.", _scripted(), usage_log=usage_log
        )
    assert len(result.steps) == 2
    assert result.steps[0].expected_result == "ID assigned."
    assert result.preconditions.startswith("User is registered")
    assert [u["group"] for u in usage_log] == [
        "ScriptPreconditions",
        "ScriptSteps",
    ]
    assert all(u["ok"] for u in usage_log)


def test_refuses_unscripted_and_exploratory():
    for assurance in (
        {"assurance_level": "unscripted", "generate_test": False},
        {"assurance_level": "exploratory", "generate_test": False},
        {},
    ):
        with pytest.raises(ValueError, match="Refusing to generate"):
            generate_test_script("The system shall do X.", assurance)
    fake = FakeLLM()
    with (
        patch("app.agents.agent_script_writer.get_llm", return_value=fake),
        pytest.raises(ValueError, match="Refusing to generate"),
    ):
        generate_test_script("The system shall do X.", {"generate_test": False})
    assert fake.calls == []


def test_retry_recovers_steps_and_persistent_failure_reraises():
    flaky = FakeLLM(fail_schema=StepsModel, fail_times=1)
    with patch("app.agents.agent_script_writer.get_llm", return_value=flaky):
        result = generate_test_script("The system shall do X.", _scripted())
    assert len(result.steps) == 2
    assert flaky.calls.count("ScriptSteps") == 2
    bad = FakeLLM(fail_schema=StepsModel, fail_times=99)
    with (
        patch("app.agents.agent_script_writer.get_llm", return_value=bad),
        pytest.raises(ValidationError),
    ):
        generate_test_script("The system shall do X.", _scripted(), max_retries=2)
    assert bad.calls.count("ScriptSteps") == 3


def test_empty_steps_rejected():
    with pytest.raises(ValidationError):
        ScriptModel(preconditions="Ready.", steps=[])
