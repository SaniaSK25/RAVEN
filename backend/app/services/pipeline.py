"""One requirement's full analysis: extract, assess, gate, persist.

Shared by the import script (per-row opt-in) and the analyze script
(per-selection). No file parsing, no prompting, no commits — the caller
owns the transaction and the user interaction.
"""

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
from app.services.assessment import assess_evidence
from app.services.persistence import ensure_prompt_version, save_assessment

PROMPTS = {
    "writer_name": WRITER_NAME,
    "writer_version": WRITER_VERSION,
    "writer_text": PRECONDITIONS_SYSTEM + STEPS_SYSTEM,
    "extractor_name": EXTRACTOR_NAME,
    "extractor_version": EXTRACTOR_VERSION,
    "extractor_text": EXTRACTOR_TEXT,
}


def run_full_analysis(session, version, text, extract_fn, script_fn, prompts=None):
    """Run pipeline + persistence for one stored version. No commit."""
    prompts = prompts or PROMPTS
    record = extract_fn(text)
    assessment = assess_evidence(record)
    script = None
    if is_generation_required(assessment["assurance"]):
        script = script_fn(text, assessment["assurance"])
    ensure_prompt_version(
        session,
        prompts["extractor_name"],
        prompts["extractor_version"],
        prompts["extractor_text"],
    )
    saved = save_assessment(session, version, record, assessment, script, prompts)
    return {"assessment": assessment, "risk_assessment_id": saved.id}
