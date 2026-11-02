"""Batch-based classification of requirement wording by control area."""

from __future__ import annotations

import json
import math
import os
from collections.abc import Callable
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.bedrock_config import TokenCollector, get_llm
from app.core.config import settings

CONTROL_AREAS: dict[str, str] = {
    "audit_trail": "AUDIT_TRAIL",
    "e_signature": "E_SIGNATURE",
    "access_control": "ACCESS_CONTROL",
    "record_retention": "RECORD_RETENTION",
    "data_integrity": "DATA_INTEGRITY",
}

SYSTEM_PROMPT = """Classify the wording of supplied LIMS requirements against only the supplied control-area names.
This is a requirement-wording classification, not a regulatory assessment.
Do not infer software implementation, system behaviour, regulatory applicability, or unstated controls.
Use only the exact requirement keys supplied.
Use the supplied FULL and PARTIAL criteria for every control area.
Do not combine multiple partial requirements into a full match. Do not assign unrelated requirements.
Return only compact JSON. Include exactly the supplied control-area keys; each value must contain only fully_covered and partially_covered arrays. Omit explanations and all other fields."""


class ClassificationError(ValueError):
    """A model response failed parsing or validation for its batch."""


def validate_requirement_keys(requirements: list[dict[str, Any]]) -> set[str]:
    keys = [str(item.get("key", "")) for item in requirements]
    if any(not key for key in keys):
        raise ValueError("Every requirement must have a non-empty key.")
    if len(keys) != len(set(keys)):
        raise ValueError("Duplicate requirement keys were supplied.")
    return set(keys)


def _criteria_text() -> str:
    return (
        f"FULL criterion: {settings.COMPLIANCE_FULL_COVERAGE_CRITERION}\n"
        f"PARTIAL criterion: {settings.COMPLIANCE_PARTIAL_COVERAGE_CRITERION}"
    )


def build_messages(
    requirements: list[dict[str, Any]],
    control_areas: list[str] | tuple[str, ...],
) -> list[SystemMessage | HumanMessage]:
    unknown = set(control_areas) - CONTROL_AREAS.keys()
    if unknown:
        raise ValueError(f"Unknown control areas: {', '.join(sorted(unknown))}.")
    keys = validate_requirement_keys(requirements)
    if not keys:
        raise ValueError("At least one requirement is required.")
    if not control_areas:
        raise ValueError("At least one control area is required.")

    input_object = {
        "control_areas": {key: CONTROL_AREAS[key] for key in control_areas},
        "requirements": [
            {"key": item["key"], "text": item["text"]} for item in requirements
        ],
        "criteria": _criteria_text(),
        "response_shape": {
            key: {"fully_covered": ["REQ-001"], "partially_covered": []}
            for key in control_areas
        },
    }
    return [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=json.dumps(input_object, ensure_ascii=False)),
    ]


def _message_text(messages: list[SystemMessage | HumanMessage]) -> str:
    return "\n".join(str(message.content) for message in messages)


def configured_model_id() -> str:
    return os.environ.get("BEDROCK_MODEL_ID", "")


def estimate_input_tokens(
    model_id: str, messages: list[SystemMessage | HumanMessage]
) -> int:
    """Estimate input tokens from the complete rendered prompt, including control definitions."""
    rendered = _message_text(messages)
    encoded_bytes = len(rendered.encode("utf-8"))
    model = model_id.lower()
    # Claude-family prompts tend to tokenize prose and JSON more densely than
    # the generic Bedrock fallback; the estimate is intentionally conservative.
    bytes_per_token = 3.0 if "claude" in model else 4.0
    return max(1, math.ceil(encoded_bytes / bytes_per_token))


def chunk_requirements(
    requirements: list[dict[str, Any]],
    model_id: str,
    max_input_tokens: int | None = None,
    max_requirements: int | None = None,
) -> list[list[dict[str, Any]]]:
    """Greedily pack requirements using the rendered full-area prompt estimate."""
    validate_requirement_keys(requirements)
    if not requirements:
        return []
    token_limit = max_input_tokens or settings.COMPLIANCE_MAX_INPUT_TOKENS
    item_limit = max_requirements or settings.COMPLIANCE_MAX_REQUIREMENTS_PER_BATCH
    chunks: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    all_areas = list(CONTROL_AREAS)
    for requirement in requirements:
        candidate = [*current, requirement]
        messages = build_messages(candidate, all_areas)
        if current and (
            len(candidate) > item_limit
            or estimate_input_tokens(model_id, messages) > token_limit
        ):
            chunks.append(current)
            current = []
            messages = build_messages([requirement], all_areas)
        if estimate_input_tokens(model_id, messages) > token_limit:
            raise ValueError(
                f"Requirement {requirement['key']} exceeds the configured input-token limit."
            )
        current.append(requirement)
    if current:
        chunks.append(current)
    return chunks


def _extract_json(content: Any) -> dict[str, Any]:
    if isinstance(content, str):
        raw = content.strip()
    elif isinstance(content, list):
        raw = "".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in content
        ).strip()
    else:
        raise ClassificationError("The model response did not contain JSON text.")
    if not raw:
        raise ClassificationError("The model returned an empty response.")
    try:
        result = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ClassificationError(
            f"The model returned invalid or truncated JSON: {exc.msg}."
        ) from exc
    if not isinstance(result, dict):
        raise ClassificationError("The model response must be a JSON object.")
    return result


def validate_batch_response(
    response: dict[str, Any],
    requirements: list[dict[str, Any]],
    control_areas: list[str] | tuple[str, ...],
) -> dict[str, dict[str, list[str]]]:
    """Reject unknown fields, areas, keys, and duplicate matches."""
    requirement_keys = validate_requirement_keys(requirements)
    expected_areas = set(control_areas)
    unknown_areas = set(response) - CONTROL_AREAS.keys()
    if unknown_areas:
        raise ClassificationError(
            f"Unknown control areas returned: {', '.join(sorted(unknown_areas))}."
        )
    if set(response) != expected_areas:
        missing = expected_areas - set(response)
        extra = set(response) - expected_areas
        raise ClassificationError(
            f"Control-area keys differ from the request (missing={sorted(missing)}, extra={sorted(extra)})."
        )

    validated: dict[str, dict[str, list[str]]] = {}
    for area in control_areas:
        value = response[area]
        if not isinstance(value, dict) or set(value) != {
            "fully_covered",
            "partially_covered",
        }:
            raise ClassificationError(
                f"{area} must contain only fully_covered and partially_covered."
            )
        full = value["fully_covered"]
        partial = value["partially_covered"]
        if not isinstance(full, list) or not isinstance(partial, list):
            raise ClassificationError(f"{area} classifications must be arrays.")
        if any(not isinstance(key, str) for key in full + partial):
            raise ClassificationError(f"{area} keys must be strings.")
        combined = full + partial
        unknown_keys = set(combined) - requirement_keys
        if unknown_keys:
            raise ClassificationError(
                f"{area} returned unknown requirement keys: {', '.join(sorted(unknown_keys))}."
            )
        if len(combined) != len(set(combined)):
            raise ClassificationError(
                f"{area} contains duplicate keys or a key in both classifications."
            )
        validated[area] = {"fully_covered": full, "partially_covered": partial}
    return validated


def _response_text(message: Any) -> Any:
    return getattr(message, "content", None)


def _actual_usage(collector: TokenCollector) -> tuple[int | None, int | None]:
    if not collector.calls or not all(call["available"] for call in collector.calls):
        return None, None
    totals = collector.totals()
    return totals["input_tokens"], totals["output_tokens"]


def _totals(invocations: list[dict[str, Any]]) -> dict[str, Any]:
    actual_complete = all(
        invocation["actual_input_tokens"] is not None
        and invocation["actual_output_tokens"] is not None
        for invocation in invocations
    )
    input_tokens = sum(
        invocation["actual_input_tokens"] or 0 for invocation in invocations
    )
    output_tokens = sum(
        invocation["actual_output_tokens"] or 0 for invocation in invocations
    )
    return {
        "total_batches": len(
            {invocation["batch_number"] for invocation in invocations}
        ),
        "estimated_input_tokens": sum(
            invocation["estimated_input_tokens"] for invocation in invocations
        ),
        "actual_input_tokens": input_tokens if actual_complete else None,
        "actual_output_tokens": output_tokens if actual_complete else None,
        "total_actual_tokens": input_tokens + output_tokens
        if actual_complete
        else None,
        "actual_usage_complete": actual_complete,
    }


def run_classification(
    requirements: list[dict[str, Any]],
    *,
    on_invocation: Callable[[dict[str, Any]], None] | None = None,
    on_batch_progress: Callable[[int, int], None] | None = None,
    max_output_tokens: int | None = None,
    max_input_tokens: int | None = None,
    max_requirements_per_batch: int | None = None,
) -> dict[str, Any]:
    """Classify requirements in token-bounded batches with per-area early stopping."""
    validate_requirement_keys(requirements)
    if not requirements:
        raise ValueError("At least one requirement is required.")

    output_limit = max_output_tokens or settings.COMPLIANCE_MAX_OUTPUT_TOKENS
    model_id = configured_model_id()
    chunks = chunk_requirements(
        requirements,
        model_id,
        max_input_tokens=max_input_tokens,
        max_requirements=max_requirements_per_batch,
    )
    accumulated = {
        area: {"fully_covered": [], "partially_covered": []} for area in CONTROL_AREAS
    }
    invocations: list[dict[str, Any]] = []

    for batch_number, batch in enumerate(chunks, start=1):
        pending_areas = [
            area for area in CONTROL_AREAS if not accumulated[area]["fully_covered"]
        ]
        if not pending_areas:
            break
        messages = build_messages(batch, pending_areas)
        estimated = estimate_input_tokens(model_id, messages)
        if on_batch_progress is not None:
            on_batch_progress(batch_number, len(batch))

        llm = get_llm(max_tokens=output_limit)
        actual_model_id = getattr(llm, "model_id", None) or model_id or "unknown"
        collector = TokenCollector()
        invocation = {
            "batch_number": batch_number,
            "attempt": 1,
            "requirements_processed": len(batch),
            "estimated_input_tokens": estimated,
            "actual_input_tokens": None,
            "actual_output_tokens": None,
            "model_id": actual_model_id,
            "max_output_tokens": output_limit,
            "status": "FAILED",
            "error": None,
        }
        try:
            message = llm.invoke(
                messages,
                config={"callbacks": [collector]},
            )
            input_actual, output_actual = _actual_usage(collector)
            invocation["actual_input_tokens"] = input_actual
            invocation["actual_output_tokens"] = output_actual
            parsed = _extract_json(_response_text(message))
            validated = validate_batch_response(parsed, batch, pending_areas)
        except Exception as exc:
            invocation["error"] = str(exc)
            invocations.append(invocation)
            if on_invocation is not None:
                on_invocation(invocation)
            raise

        invocation["status"] = "COMPLETED"
        invocations.append(invocation)
        if on_invocation is not None:
            on_invocation(invocation)
        for area, result in validated.items():
            accumulated[area]["fully_covered"].extend(result["fully_covered"])
            accumulated[area]["partially_covered"].extend(result["partially_covered"])

    final_areas: dict[str, dict[str, Any]] = {}
    for area, matches in accumulated.items():
        if matches["fully_covered"]:
            verdict = "COVERED"
        elif matches["partially_covered"]:
            verdict = "PARTIALLY_COVERED"
        else:
            verdict = "ABSENT"
        final_areas[area] = {
            "verdict": verdict,
            "fully_covered_requirements": matches["fully_covered"],
            "partially_covered_requirements": matches["partially_covered"],
        }

    return {
        "assessment_status": "COMPLETED",
        "control_areas": final_areas,
        "token_usage": _totals(invocations),
        "batch_usage": invocations,
        "requirements_count": len(requirements),
        "matching_lists_exhaustive": False,
    }


def prompt_snapshot_text() -> str:
    return (
        SYSTEM_PROMPT
        + "\n\n"
        + _criteria_text()
        + "\n\nControl areas: "
        + json.dumps(CONTROL_AREAS, sort_keys=True)
    )


def build_review_prompt(requirements: list[dict[str, Any]]) -> str:
    """Build the current full-control-area prompt for the first batch."""
    messages = build_messages(requirements, list(CONTROL_AREAS))
    return _message_text(messages)
