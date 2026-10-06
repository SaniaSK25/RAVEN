from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError
from app.agents.bedrock_config import TokenCollector, get_llm
from app.models.models import TestScript

PROMPT_NAME = "test_script_generator"
PROMPT_VERSION = 1


def is_generation_required(assurance: dict) -> bool:
    """Gate: generate a script only when the assurance decision says so
    (scripted verdicts). Everything else skips generation entirely."""
    return assurance.get("generate_test", False) is True


def generate_test_script(
    requirement_text: str, max_retries: int = 2, usage_log=None
) -> TestScript:
    """Generate a step-by-step validation script for one requirement.

    Takes requirement text only — the generate/don't-generate decision
    belongs to the caller (see is_generation_required). Retries on
    validation failure with the error fed back, like evidence extraction.
    """
    llm = get_llm()
    model_id = getattr(llm, "model_id", "")
    structured = llm.with_structured_output(TestScript)
    first_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert Pharmaceutical Software Validation (CSV) Engineer. "
                "Given a software requirement, write a detailed step-by-step test script "
                "that proves the requirement is met. Be highly specific in your actions and expected results. "
                "Return preconditions plus at least one numbered step, each with an action and an expected result.",
            ),
            ("human", "Write a test script for this requirement: {requirement}"),
        ]
    )
    retry_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert Pharmaceutical Software Validation (CSV) Engineer. "
                "Given a software requirement, write a detailed step-by-step test script "
                "that proves the requirement is met. Be highly specific in your actions and expected results. "
                "Return preconditions plus at least one numbered step, each with an action and an expected result.",
            ),
            ("human", "Write a test script for this requirement: {requirement}"),
            (
                "human",
                "Your previous answer was REJECTED with this validation error:\n"
                "{error}\n"
                "Return the FULL test script again with the reported problem fixed.",
            ),
        ]
    )
    error_text = None
    for attempt in range(1 + max_retries):
        collector = TokenCollector()
        config = {"callbacks": [collector]}
        try:
            if error_text is None:
                result = (first_prompt | structured).invoke(
                    {"requirement": requirement_text}, config=config
                )
            else:
                result = (retry_prompt | structured).invoke(
                    {"requirement": requirement_text, "error": error_text},
                    config=config,
                )
        except ValidationError as exc:
            _log_usage(usage_log, model_id, attempt, collector, ok=False)
            error_text = str(exc)
            if attempt == max_retries:
                raise
        else:
            _log_usage(usage_log, model_id, attempt, collector, ok=True)
            return result


def _log_usage(usage_log, model_id, attempt, collector, ok):
    if usage_log is None:
        return
    usage_log.append(
        {
            "group": "TestScript",
            "model": model_id,
            "attempt": attempt + 1,
            "ok": ok,
            **collector.totals(),
        }
    )
