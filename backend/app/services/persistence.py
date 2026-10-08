"""Persist assessed requirements (pipeline outputs -> ORM rows).

Pure mapping + saves: no LLM, no file parsing, no network. Every value
stored here is produced by the engines or the extractor — this module
computes nothing, it only translates shapes (lowercase levels to UPPER
enums, int GAMP to "Category N" strings) and links rows.
"""

import hashlib

from app.models.assurance_decision import AssuranceDecision as AssuranceDecisionRow
from app.models.configuration_version import ConfigurationVersion
from app.models.engine_results import (
    DetectabilityResult,
    ProbabilityResult,
    SeverityResult,
)
from app.models.enums import AssuranceLevel, ComplexityLevel, DetectionLevel, RiskBand
from app.models.evidence import EvidenceRecord
from app.models.prompt_version import PromptVersion
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.stored_evidence import Evidence as StoredEvidence
from app.models.test_script import TestScript as TestScriptRow
from app.services.engine_result import RULE_VERSION

BAND_MAP = {"Low": RiskBand.LOW, "Medium": RiskBand.MEDIUM, "High": RiskBand.HIGH}


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ensure_configuration_version(session, version: str = RULE_VERSION):
    row = session.query(ConfigurationVersion).filter_by(version=version).first()
    if row is None:
        row = ConfigurationVersion(
            version=version,
            description=f"Rule snapshot {version} (weighted RPN, severity floor).",
            config_hash=_sha(f"raven-rules-{version}"),
        )
        session.add(row)
        session.flush()
    return row


def ensure_prompt_version(session, agent_name: str, version: int, prompt_text: str):
    digest = _sha(f"{agent_name}:{version}:{prompt_text}")
    row = session.query(PromptVersion).filter_by(hash=digest).first()
    if row is None:
        row = PromptVersion(
            agent_name=agent_name, version=version, prompt=prompt_text, hash=digest
        )
        session.add(row)
        session.flush()
    return row


def _triples(prefix: str, group, fields: tuple) -> dict:
    out = {}
    for name in fields:
        field = getattr(group, name)
        out[f"{prefix}{name}_value"] = field.value
        out[f"{prefix}{name}_confidence"] = field.confidence
        out[f"{prefix}{name}_evidence"] = field.evidence
    return out


def build_evidence_row(
    version_id, record: EvidenceRecord, gxp_impact: bool, gxp_reason: str
) -> StoredEvidence:
    kwargs = {"requirement_version_id": version_id}
    kwargs.update(
        _triples(
            "",
            record.severity,
            (
                "patient_safety",
                "product_quality",
                "batch_release",
                "data_integrity",
                "regulatory_compliance",
                "business_continuity",
            ),
        )
    )
    for name in (
        "functional_complexity",
        "dependency_complexity",
        "workflow_complexity",
    ):
        field = getattr(record.probability, name)
        kwargs[f"{name}_value"] = ComplexityLevel(field.value)
        kwargs[f"{name}_confidence"] = field.confidence
        kwargs[f"{name}_evidence"] = field.evidence
    for name in ("detection_controls", "traceability", "failure_visibility"):
        field = getattr(record.detectability, name)
        kwargs[f"{name}_value"] = DetectionLevel(field.value)
        kwargs[f"{name}_confidence"] = field.confidence
        kwargs[f"{name}_evidence"] = field.evidence
    # GAMP, like GxP, exists as bare classification + reason (no per-field
    # confidence in the Pydantic contract), so it is stored confidence 1.0:
    # classified by the extractor, recorded verbatim.
    kwargs.update(
        gamp_category_value=record.gamp_category,
        gamp_category_confidence=1.0,
        gamp_category_evidence=record.gamp_reason,
        gamp_reason=record.gamp_reason,
    )
    # GxP exists only as a derived verdict (assessment time), not as
    # extracted triples — so it is stored with confidence 1.0, meaning
    # "computed deterministically", with the derivation as its evidence.
    kwargs.update(
        gxp_impact_value=gxp_impact,
        gxp_impact_confidence=1.0,
        gxp_impact_evidence=gxp_reason,
        gxp_reason=gxp_reason,
    )
    return StoredEvidence(**kwargs)


def save_assessment(
    session,
    version: RequirementVersion,
    record: EvidenceRecord,
    assessment: dict,
    test_script=None,
    prompts: dict | None = None,
) -> RiskAssessment:
    """Persist one full assessment. Returns the RiskAssessment row.

    Gate enforced here too: a script row is written only when
    assurance.generate_test is True — and providing one otherwise raises.
    """
    prompts = prompts or {}
    wants_script = bool(assessment["assurance"]["generate_test"])
    if wants_script and test_script is None:
        raise ValueError("Assurance requires a test script but none was given.")
    if not wants_script and test_script is not None:
        raise ValueError("Refusing to store a test script for a non-scripted verdict.")

    cfg = ensure_configuration_version(session)
    evidence = build_evidence_row(
        version.id,
        record,
        assessment.get("gxp_impact", False),
        assessment.get("gxp_reason", "No GxP impact flags were raised."),
    )
    session.add(evidence)
    session.flush()

    sev, prob, det = (
        assessment["severity"],
        assessment["probability"],
        assessment["detectability"],
    )
    ra = RiskAssessment(
        requirement_version_id=version.id,
        evidence_id=evidence.id,
        rule_config_version_id=cfg.id,
        gxp_impact=assessment.get("gxp_impact", False),
        gxp_reason=assessment.get("gxp_reason", "No GxP impact flags were raised."),
        gamp_category=f"Category {record.gamp_category}",
        gamp_reason=record.gamp_reason,
        rpn=assessment["rpn"],
        rpn_points=assessment["rpn_points"],
        band=BAND_MAP[assessment["band"]],
        status="DRAFT",
        is_current=True,
    )
    session.add(ra)
    session.flush()

    sev_row = SeverityResult(
        risk_assessment_id=ra.id,
        score=sev["score"],
        rule_id=sev["rule_id"],
        rule_version=sev["rule_version"],
        decision_path=sev["decision_path"],
        reasoning=sev["reasoning"],
    )
    prob_comp = prob["decision_path"][-1]
    prob_row = ProbabilityResult(
        risk_assessment_id=ra.id,
        score=prob["score"],
        rule_id=prob["rule_id"],
        rule_version=prob["rule_version"],
        decision_path=prob["decision_path"],
        weighted_sum=float(prob_comp["sum"]),
        gamp_modifier=float(prob_comp["gamp_modifier"]),
        reasoning=prob["reasoning"],
    )
    det_comp = det["decision_path"][-1]
    det_row = DetectabilityResult(
        risk_assessment_id=ra.id,
        score=det["score"],
        rule_id=det["rule_id"],
        rule_version=det["rule_version"],
        decision_path=det["decision_path"],
        controls_floor=det_comp.get("controls_floor"),
        reasoning=det["reasoning"],
    )
    session.add_all([sev_row, prob_row, det_row])
    session.flush()
    ra.severity_result_id = sev_row.id
    ra.probability_result_id = prob_row.id
    ra.detectability_result_id = det_row.id

    decision = assessment["assurance"]
    ad = AssuranceDecisionRow(
        risk_assessment_id=ra.id,
        assurance_level=AssuranceLevel[decision["assurance_level"].upper()],
        generate_test=decision["generate_test"],
        rule_id=decision["rule_id"],
        rule_version=RULE_VERSION,
        reasoning=decision["reason"],
        decision_path={
            "severity": sev["score"],
            "band": assessment["band"],
            "level": decision["assurance_level"],
        },
    )
    session.add(ad)
    session.flush()

    if test_script is not None:
        pv = ensure_prompt_version(
            session,
            prompts.get("writer_name", "test_script_generator"),
            prompts.get("writer_version", 1),
            prompts.get("writer_text", "test_script_generator"),
        )
        lines = [test_script.preconditions] + [
            f"{s.step_number}. {s.action} Expected: {s.expected_result}"
            for s in test_script.steps
        ]
        ts = TestScriptRow(
            requirement_version_id=version.id,
            assurance_decision_id=ad.id,
            prompt_version_id=pv.id,
            script="\n".join(lines),
            status="DRAFT",
            version=1,
        )
        session.add(ts)
        session.flush()

    return ra
