from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError
from app.agents.bedrock_config import TokenCollector, get_llm
from app.models.models import ScriptPreconditions, ScriptSteps, TestScript

PROMPT_NAME = "test_script_generator"
PROMPT_VERSION = 3

PRECONDITIONS_SYSTEM = (
    "You are an expert Pharmaceutical Software Validation (CSV) Engineer. "
    "Given a software requirement, write ONLY the preconditions: what must "
    "be set up or true before the test begins (system state, test data, "
    "access). Return the preconditions text and nothing else."
)

STEPS_SYSTEM = (
    "You are an expert Pharmaceutical Software Validation (CSV) Engineer. "
    "Given a software requirement, write ONLY the numbered test steps that "
    "prove the requirement is met. Return 2 to 6 steps. Every step is an "
    "object with exactly these fields: step_number (starting at 1), action "
    "(the concrete action the tester performs), expected_result (the exact "
    "expected behaviour). Example shape (literal JSON, not a template): "
    '{{"step_number": 1, "action": "Register a sample.", '
    '"expected_result": "A unique identifier is assigned."}}. '
    "The steps array is mandatory: never null, never empty."
)


def is_generation_required(assurance: dict) -> bool:
    """Gate: generate a script only when the assurance decision says so
    (scripted verdicts). Everything else skips generation entirely."""
    return assurance.get("generate_test", False) is True


def _run_part(
    schema, system_text, human_text, requirement_text, llm, max_retries, usage_log
):
    """One small structured call with validation-feedback retries.

    On each rejection, the model's raw args keys are printed so the next
    failure is diagnosable from the console, not just the traceback.
    """
    group = schema.__name__
    model_id = getattr(llm, "model_id", "")
    structured = llm.with_structured_output(schema)
    first_prompt = ChatPromptTemplate.from_messages(
        [("system", system_text), ("human", human_text)]
    )
    retry_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_text),
            ("human", human_text),
            (
                "human",
                "Your previous answer was REJECTED with this validation error:\n"
                "{error}\n"
                "Return the FULL answer again with the reported problem fixed. "
                "Do not omit any field.",
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
            _log_usage(usage_log, group, model_id, attempt, collector, ok=False)
            _log_rejection(group, attempt, exc)
            error_text = str(exc)
            if attempt == max_retries:
                raise
        else:
            _log_usage(usage_log, group, model_id, attempt, collector, ok=True)
            return result


def _log_rejection(group, attempt, exc):
    keys = sorted({str(loc) for err in exc.errors() for loc in err.get("loc", ())})
    print(f"[{group}] attempt {attempt + 1} rejected; problem fields: {keys}")


def _log_usage(usage_log, group, model_id, attempt, collector, ok):
    if usage_log is None:
        return
    usage_log.append(
        {
            "group": group,
            "model": model_id,
            "attempt": attempt + 1,
            "ok": ok,
            **collector.totals(),
        }
    )


def generate_test_script(
    requirement_text: str, assurance: dict, max_retries: int = 2, usage_log=None
) -> TestScript:
    """Generate a step-by-step validation script: preconditions and steps
    in two independent calls, assembled in code.

    `assurance` is REQUIRED with generate_test=True, else this raises
    before any LLM contact — unscripted/exploratory verdicts can never
    produce scripts.
    """
    if not is_generation_required(assurance):
        level = assurance.get("assurance_level", "?")
        raise ValueError(
            f"Refusing to generate test script: assurance_level={level!r} "
            f"does not require one."
        )
    llm = get_llm()
    preconditions = _run_part(
        ScriptPreconditions,
        PRECONDITIONS_SYSTEM,
        "Write the preconditions for testing this requirement: {requirement}",
        requirement_text,
        llm,
        max_retries,
        usage_log,
    )
    steps = _run_part(
        ScriptSteps,
        STEPS_SYSTEM,
        "Write the test steps for this requirement: {requirement}",
        requirement_text,
        llm,
        max_retries,
        usage_log,
    )
    return TestScript(preconditions=preconditions.preconditions, steps=steps.steps)
