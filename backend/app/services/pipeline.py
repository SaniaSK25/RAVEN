"""One requirement's full analysis: extract, assess, gate, persist.

Shared by the import script (per-row opt-in) and the analyze script
(per-selection). API callers can defer script generation until explicit
user request. No commits — the caller owns the transaction.
"""

from inspect import Parameter, signature

from app.agents.agent_analyzer import (
    PROMPT_NAME as EXTRACTOR_NAME,
)
from app.agents.agent_analyzer import (
    PROMPT_TEXT as EXTRACTOR_TEXT,
)
from app.agents.agent_analyzer import (
    PROMPT_VERSION as EXTRACTOR_VERSION,
)
from app.agents.agent_script_writer import (
    PRECONDITIONS_SYSTEM,
    STEPS_SYSTEM,
    is_generation_required,
)
from app.agents.agent_script_writer import (
    PROMPT_NAME as WRITER_NAME,
)
from app.agents.agent_script_writer import (
    PROMPT_VERSION as WRITER_VERSION,
)
from app.models.token_usage import TokenUsage
from app.services.assessment import assess_evidence
from app.services.persistence import (
    ensure_prompt_version,
    save_assessment,
    save_generated_test_script,
)

PROMPTS = {
    "writer_name": WRITER_NAME,
    "writer_version": WRITER_VERSION,
    "writer_text": PRECONDITIONS_SYSTEM + STEPS_SYSTEM,
    "extractor_name": EXTRACTOR_NAME,
    "extractor_version": EXTRACTOR_VERSION,
    "extractor_text": EXTRACTOR_TEXT,
}
SCRIPT_PROMPTS = {
    "writer_name": WRITER_NAME,
    "writer_version": WRITER_VERSION,
    "writer_text": PRECONDITIONS_SYSTEM + STEPS_SYSTEM,
}


def _call_with_usage(fn, args, usage_log):
    """Pass usage collection only to functions that support it."""
    parameters = signature(fn).parameters.values()
    accepts_usage = any(
        parameter.name == "usage_log"
        or parameter.kind is Parameter.VAR_KEYWORD
        for parameter in parameters
    )
    if accepts_usage:
        return fn(*args, usage_log=usage_log)
    return fn(*args)


def _usage_totals(entries):
    return {
        "input_tokens": sum(entry.get("input_tokens", 0) for entry in entries),
        "output_tokens": sum(entry.get("output_tokens", 0) for entry in entries),
    }


def save_token_usage(
    session, version, extraction_entries, script_entries, status, error=None
):
    extraction = _usage_totals(extraction_entries)
    script = _usage_totals(script_entries)
    input_tokens = extraction["input_tokens"] + script["input_tokens"]
    output_tokens = extraction["output_tokens"] + script["output_tokens"]
    record = TokenUsage(
        requirement_version_id=version.id,
        status=status,
        extraction_input_tokens=extraction["input_tokens"],
        extraction_output_tokens=extraction["output_tokens"],
        script_input_tokens=script["input_tokens"],
        script_output_tokens=script["output_tokens"],
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=input_tokens + output_tokens,
        error=error,
    )
    session.add(record)
    session.flush()
    return record


def run_full_analysis(
    session,
    version,
    text,
    extract_fn,
    script_fn,
    prompts=None,
    usage_log=None,
    generate_script=True,
):
    """Run pipeline + persistence for one stored version. No commit."""
    prompts = prompts or PROMPTS
    extraction_entries = []
    script_entries = []
    external_log = usage_log if usage_log is not None else []
    try:
        record = _call_with_usage(extract_fn, (text,), extraction_entries)
    finally:
        external_log.extend(
            {**entry, "stage": "evidence_extraction"} for entry in extraction_entries
        )
    assessment = assess_evidence(record)
    script = None
    if generate_script and is_generation_required(assessment["assurance"]):
        try:
            script = _call_with_usage(
                script_fn, (text, assessment["assurance"]), script_entries
            )
        finally:
            external_log.extend(
                {**entry, "stage": "test_script_generation"}
                for entry in script_entries
            )
    ensure_prompt_version(
        session,
        prompts["extractor_name"],
        prompts["extractor_version"],
        prompts["extractor_text"],
    )
    saved = save_assessment(
        session,
        version,
        record,
        assessment,
        script,
        prompts,
        allow_deferred_script=(
            not generate_script and is_generation_required(assessment["assurance"])
        ),
    )
    token_usage = save_token_usage(
        session, version, extraction_entries, script_entries, "SUCCEEDED"
    )
    return {
        "assessment": assessment,
        "risk_assessment_id": saved.id,
        "token_usage": token_usage,
    }


def generate_and_save_script(session, version, decision, text, script_fn, usage_log):
    """Generate/persist a script for an existing scripted decision."""
    script_entries = []
    try:
        generated = _call_with_usage(
            script_fn,
            (text, {"assurance_level": "scripted", "generate_test": True}),
            script_entries,
        )
    finally:
        usage_log.extend(
            {**entry, "stage": "test_script_generation"} for entry in script_entries
        )
    saved = save_generated_test_script(
        session,
        version,
        decision,
        generated,
        SCRIPT_PROMPTS,
    )
    token_usage = save_token_usage(session, version, [], script_entries, "SUCCEEDED")
    return saved, token_usage
