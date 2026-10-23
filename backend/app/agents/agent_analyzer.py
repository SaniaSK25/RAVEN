from typing import Literal

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, ValidationError

from app.agents.bedrock_config import TokenCollector, get_llm
from app.schemas.evidence import (
    DetectabilityEvidence,
    EvidenceRecord,
    GampClassification,
    ProbabilityEvidence,
    SeverityEvidence,
)

PROMPT_NAME = "evidence_extractor"
PROMPT_VERSION = 5
BATCH_MAX_OUTPUT_TOKENS = 8192

EVIDENCE_PREAMBLE = (
    "You are an FDA CSA evidence extractor. For EVERY field output three things: "
    "value, confidence (0.0-1.0), and one explanatory evidence sentence of "
    "about 8-12 words and at most 160 characters, grounded in the requirement text. "
    "Prefer a direct excerpt. "
    "Never invent facts not supported by the text; "
    "if the text is silent on a field, choose the conservative value with "
    "lower confidence and say what is missing."
)

SEVERITY_INSTRUCTIONS = (
    "Extract the severity group: exactly these 6 booleans: patient_safety "
    "(failure could directly harm a patient); product_quality (failure could cause "
    "an incorrect result, sample error, or specification decision); batch_release "
    "(requirement participates in batch disposition or release); data_integrity "
    "(records could become inaccurate, incomplete, altered, lost, or unavailable); "
    "regulatory_compliance (failure would breach electronic-records or GMP "
    "expectations); business_continuity (failure would interrupt or slow "
    "laboratory operations)."
)

PROBABILITY_INSTRUCTIONS = (
    "Extract the probability group: exactly these 3 enums (each LOW, MEDIUM, or HIGH): "
    "functional_complexity (complexity of the described logic); "
    "dependency_complexity (external systems, modules, data sources); "
    "workflow_complexity (roles, steps, state transitions)."
)

DETECTABILITY_INSTRUCTIONS = (
    "Extract the detectability group: exactly these 3 enums (each HIGH, MEDIUM, or LOW; "
    "polarity: HIGH means the failure is EASY to spot, LOW means it could go "
    "unnoticed): detection_controls (automated checks, interlocks, validations); "
    "traceability (audit trails, logs, history); failure_visibility (how obvious "
    "a failure is to a user or QA reviewer)."
)

GAMP_INSTRUCTIONS = (
    "Classify the requirement: gamp_category is an integer 1, 3, 4, or 5 "
    "with a concise gamp_reason sentence of at most 12 words and 160 characters."
)

BATCH_EVIDENCE_INSTRUCTIONS = (
    SEVERITY_INSTRUCTIONS
    + " "
    + PROBABILITY_INSTRUCTIONS
    + " "
    + DETECTABILITY_INSTRUCTIONS
    + " "
    + GAMP_INSTRUCTIONS
)

# Canonical prompt text recorded in PromptVersion rows (content-hashed).
PROMPT_TEXT = (
    EVIDENCE_PREAMBLE
    + BATCH_EVIDENCE_INSTRUCTIONS
    + " Analyze every requirement independently. Return one structured item "
    "per requirement using compact ordered severity, probability, and "
    "detectability arrays. Each evidence note is a complete explanatory "
    "sentence, normally 8-12 words and at most 160 characters."
)

SEVERITY_FIELDS = (
    "patient_safety",
    "product_quality",
    "batch_release",
    "data_integrity",
    "regulatory_compliance",
    "business_continuity",
)
PROBABILITY_FIELDS = (
    "functional_complexity",
    "dependency_complexity",
    "workflow_complexity",
)
DETECTABILITY_FIELDS = (
    "detection_controls",
    "traceability",
    "failure_visibility",
)


class _CompactBatchEvidenceItem(BaseModel):
    id: str
    gamp: Literal[1, 3, 4, 5]
    reason: str
    sev: list[tuple[bool, float, str]] = Field(min_length=6, max_length=6)
    prob: list[tuple[Literal["LOW", "MEDIUM", "HIGH"], float, str]] = Field(
        min_length=3, max_length=3
    )
    det: list[tuple[Literal["HIGH", "MEDIUM", "LOW"], float, str]] = Field(
        min_length=3, max_length=3
    )


class _BatchEvidenceOutput(BaseModel):
    items: list[_CompactBatchEvidenceItem]


def _extract_group(
    schema, group_instructions, requirement_text, llm, max_retries, usage_log=None
):
    """One small structured extraction with validation-feedback retries.

    If usage_log (a list) is given, one entry per LLM attempt is appended:
    group, model, attempt number, ok flag, and token counts. Failed parses
    are logged too — they still consumed tokens.
    """
    structured = llm.with_structured_output(schema)
    group_name = schema.__name__
    model_id = getattr(llm, "model_id", "")
    first_prompt = ChatPromptTemplate.from_messages([
        ("system", EVIDENCE_PREAMBLE + group_instructions),
        ("human", "Extract this evidence group for the requirement: {requirement}")
    ])
    retry_prompt = ChatPromptTemplate.from_messages([
        ("system", EVIDENCE_PREAMBLE + group_instructions),
        ("human", "Extract this evidence group for the requirement: {requirement}"),
        (
            "human",
            (
                "Your previous answer was REJECTED with this validation error:\n"
                "{error}\n"
                "Return the FULL group again with the reported problem fixed. "
                "Do not omit any field and do not change correctly returned fields."
            ),
        ),
    ])
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
            _log_usage(usage_log, group_name, model_id, attempt, collector, ok=False)
            error_text = str(exc)
            if attempt == max_retries:
                raise
        else:
            _log_usage(usage_log, group_name, model_id, attempt, collector, ok=True)
            return result


def _log_usage(usage_log, group_name, model_id, attempt, collector, ok):
    if usage_log is None:
        return
    usage_log.append(
        {
            "group": group_name,
            "model": model_id,
            "attempt": attempt + 1,
            "ok": ok,
            **collector.totals(),
        }
    )

def extract_evidence(
    requirement_text: str, max_retries: int = 2, usage_log=None
) -> EvidenceRecord:
    """RAVEN Layer 3 evidence extraction, one small group per LLM call.

    Four cheap calls (severity, probability, detectability, gamp) replace one
    big 37-field call that the model kept truncating. Assembly into
    EvidenceRecord happens in code, so a dropped group fails loudly here
    instead of silently corrupting scores downstream.

    If usage_log (a list) is given, per-attempt token usage is appended —
    kept OUT of EvidenceRecord so scoring inputs stay pure.
    """
    llm = get_llm()
    severity = _extract_group(
        SeverityEvidence, SEVERITY_INSTRUCTIONS, requirement_text, llm, max_retries,
        usage_log,
    )
    probability = _extract_group(
        ProbabilityEvidence, PROBABILITY_INSTRUCTIONS, requirement_text, llm, max_retries,
        usage_log,
    )
    detectability = _extract_group(
        DetectabilityEvidence, DETECTABILITY_INSTRUCTIONS, requirement_text, llm, max_retries,
        usage_log,
    )
    gamp = _extract_group(
        GampClassification, GAMP_INSTRUCTIONS, requirement_text, llm, max_retries,
        usage_log,
    )
    return EvidenceRecord(
        gamp_category=gamp.gamp_category,
        gamp_reason=gamp.gamp_reason,
        severity=severity,
        probability=probability,
        detectability=detectability,
    )


def extract_evidence_batch(
    requirements: list[tuple[str, str]],
    usage_log: list[dict] | None = None,
) -> dict[str, EvidenceRecord]:
    """Extract all evidence groups in exactly one call for up to ten requirements.

    Requirement text is included once per batch instead of once per evidence
    group. Invalid, missing, or malformed items fail the batch; there are no
    retries or individual-requirement fallback calls.
    """
    if not requirements or len(requirements) > 10:
        raise ValueError("Batch extraction requires between 1 and 10 requirements.")
    requirement_ids = [requirement_id for requirement_id, _ in requirements]
    if len(set(requirement_ids)) != len(requirement_ids):
        raise ValueError("Batch extraction requirement IDs must be unique.")

    llm = get_llm(max_tokens=BATCH_MAX_OUTPUT_TOKENS)
    group_name = "BatchEvidenceRecord"
    model_id = getattr(llm, "model_id", "")
    supplied = "\n".join(
        f'<requirement id="{requirement_id}">{text}</requirement>'
        for requirement_id, text in requirements
    )
    system = (
        "You are an FDA CSA evidence extractor. Analyze every requirement "
        "independently. Use only facts supported by its text; when a field is "
        "unstated, choose the conservative value and lower confidence. For every "
        "evidence note, write one complete, grammatical explanatory sentence "
        "grounded in the requirement, normally 8-12 words and no more than 160 "
        "characters. Do not use fragments or bare labels. "
        + BATCH_EVIDENCE_INSTRUCTIONS
        + " Return exactly one structured item per input using the required output "
        "schema: items (array), id (exact requirement ID), gamp (1, 3, 4, "
        "or 5), reason (at most 5 words), sev (six [boolean, confidence, note] "
        "arrays), prob (three [LOW/MEDIUM/HIGH, confidence, note] arrays), and "
        "det (three [HIGH/MEDIUM/LOW, confidence, note] arrays). The sev array "
        "order is patient_safety, product_quality, batch_release, data_integrity, "
        "regulatory_compliance, business_continuity. The prob order is "
        "functional_complexity, dependency_complexity, workflow_complexity. The "
        "det order is detection_controls, traceability, failure_visibility. Keep "
        "each evidence note to one complete explanatory sentence, normally 8-12 "
        "words and at most 160 characters. End each note with sentence punctuation. "
        "Copy IDs exactly. "
        "Do not omit fields, share evidence, or add markdown."
    )
    human = (
        "Return one compact item for every requirement.\n"
        "{requirements}"
    )
    first_prompt = ChatPromptTemplate.from_messages(
        [("system", system), ("human", human)]
    )
    structured = llm.with_structured_output(_BatchEvidenceOutput)
    collector = TokenCollector()
    config = {"callbacks": [collector]}
    try:
        output = (first_prompt | structured).invoke(
            {"requirements": supplied}, config=config
        )
    except Exception:
        _log_usage(usage_log, group_name, model_id, 0, collector, ok=False)
        raise
    _log_usage(usage_log, group_name, model_id, 0, collector, ok=True)

    expected_ids = {requirement_id for requirement_id, _ in requirements}
    records: dict[str, EvidenceRecord] = {}
    for item in output.items:
        if item.id not in expected_ids:
            raise ValueError(
                f"Batch extraction returned unknown requirement ID "
                f"{item.id!r}."
            )
        if item.id in records:
            raise ValueError(
                f"Batch extraction returned duplicate requirement ID "
                f"{item.id!r}."
            )
        def expand_fields(names, values):
            return {
                name: {
                    "value": value,
                    "confidence": confidence,
                    "evidence": evidence,
                }
                for name, (value, confidence, evidence) in zip(
                    names, values, strict=True
                )
            }

        records[item.id] = EvidenceRecord.model_validate(
            {
                "gamp_category": item.gamp,
                "gamp_reason": item.reason,
                "severity": expand_fields(SEVERITY_FIELDS, item.sev),
                "probability": expand_fields(PROBABILITY_FIELDS, item.prob),
                "detectability": expand_fields(DETECTABILITY_FIELDS, item.det),
            }
        )

    missing_ids = expected_ids - records.keys()
    if missing_ids:
        raise ValueError(
            "Batch extraction omitted requirement IDs: "
            + ", ".join(sorted(missing_ids))
            + "."
        )
    return records