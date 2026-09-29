from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError
from app.agents.bedrock_config import TokenCollector, get_llm
from app.models.evidence import (
    DetectabilityEvidence,
    EvidenceRecord,
    GampClassification,
    ProbabilityEvidence,
    SeverityEvidence,
)
from app.models.models import RequirementAnalysis

def analyze_requirement(requirement_text: str) -> RequirementAnalysis:
    """LEGACY level-based analysis. Kept until cutover; new code uses
    extract_evidence() below."""
    llm = get_llm()

    structured_llm = llm.with_structured_output(RequirementAnalysis)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert FDA Quality Assurance and CSV Validation Engineer. "
        "Analyze the provided software requirement and classify it according to GAMP 5 and GxP impact. "
        "Extract factual reasoning for severity, probability, and detectability."),
        ("human", "Analyze this requirement: {requirement}")
    ])

    agent_chain = prompt | structured_llm

    result = agent_chain.invoke({"requirement": requirement_text})
    return result


EVIDENCE_PREAMBLE = (
    "You are an FDA CSA evidence extractor. For EVERY field output three things: "
    "value, confidence (0.0-1.0), and exactly one evidence sentence grounded "
    "in the requirement text. Never invent facts not supported by the text; "
    "if the text is silent on a field, choose the conservative value with "
    "lower confidence and say what is missing. "
    "Output ONLY the requested group, nothing else."
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
    "with a one-sentence gamp_reason."
)


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
        ("human",
         "Your previous answer was REJECTED with this validation error:\n"
         "{error}\n"
         "Return the FULL group again with the reported problem fixed. "
         "Do not omit any field and do not change correctly returned fields.")
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