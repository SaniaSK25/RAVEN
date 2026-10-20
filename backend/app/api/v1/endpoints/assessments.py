"""Risk-assessment list endpoint (read-only).

Returns persisted RiskAssessment rows with their requirement identity and
persisted deterministic outputs. No scores are computed here: severity /
probability / detectability come from the linked sub-result rows, the band /
RPN / GxP / GAMP values are read verbatim, and freshness / current-version
flags are exposed so callers preserve traceability semantics.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.agents.agent_analyzer import extract_evidence
from app.agents.agent_script_writer import generate_test_script
from app.db.dependencies import DBSession
from app.models.assurance_decision import AssuranceDecision
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.token_usage import TokenUsage
from app.schemas.responses import (
    AssessmentRunResponse,
    GenerateScriptResponse,
    RiskAssessmentPageResponse,
)
from app.services.pipeline import (
    generate_and_save_script,
    run_full_analysis,
    save_token_usage,
)
from app.services.traceability.sync import sync_links

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def _serialise(assessment: RiskAssessment) -> dict:
    version = assessment.requirement_version
    requirement = version.requirement if version is not None else None
    severity = assessment.severity_result
    probability = assessment.probability_result
    detectability = assessment.detectability_result
    rule_config = assessment.rule_config
    return {
        "id": str(assessment.id),
        "requirement_id": str(requirement.id) if requirement is not None else None,
        "requirement_key": requirement.req_key if requirement is not None else None,
        "requirement_title": requirement.title if requirement is not None else None,
        "requirement_version_id": str(assessment.requirement_version_id),
        "version": version.version_number if version is not None else None,
        "current_requirement_version": (
            requirement.current_version.version_number
            if requirement is not None and requirement.current_version is not None
            else None
        ),
        "is_current_version": bool(version.is_current) if version is not None else False,
        "is_current": bool(assessment.is_current),
        "status": assessment.status,
        "freshness": assessment.freshness,
        "severity": severity.score if severity is not None else None,
        "probability": probability.score if probability is not None else None,
        "detectability": detectability.score if detectability is not None else None,
        "severity_rule_id": severity.rule_id if severity is not None else None,
        "probability_rule_id": probability.rule_id if probability is not None else None,
        "detectability_rule_id": (
            detectability.rule_id if detectability is not None else None
        ),
        "rpn": assessment.rpn,
        "rpn_points": assessment.rpn_points,
        "band": getattr(assessment.band, "value", assessment.band),
        "gxp_impact": assessment.gxp_impact,
        "gamp_category": assessment.gamp_category,
        "rule_version": rule_config.version if rule_config is not None else None,
        "created_at": (
            assessment.created_at.isoformat() if assessment.created_at else None
        ),
    }


@router.get("", response_model=RiskAssessmentPageResponse)
def list_assessments(
    db: DBSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    freshness: str | None = Query(default=None),
    requirement_key: str | None = Query(default=None),
    include_superseded: bool = Query(default=False),
):
    query = (
        db.query(RiskAssessment)
        .join(
            RequirementVersion,
            RiskAssessment.requirement_version_id == RequirementVersion.id,
        )
        .join(Requirement, RequirementVersion.requirement_id == Requirement.id)
    )
    if not include_superseded:
        query = query.filter(RiskAssessment.freshness != "superseded")
    if freshness:
        query = query.filter(RiskAssessment.freshness == freshness)
    if requirement_key:
        query = query.filter(Requirement.req_key == requirement_key)
    query = query.order_by(RiskAssessment.created_at.desc())
    total = query.count()
    rows = query.offset(skip).limit(limit).all()
    return {
        "items": [_serialise(row) for row in rows],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


def _resolve_requirement(db, raw_id: str) -> Requirement:
    """Resolve by UUID primary key or human req_key; None when missing."""
    try:
        parsed = UUID(str(raw_id))
    except (ValueError, AttributeError, TypeError):
        parsed = None
    requirement = db.get(Requirement, parsed) if parsed is not None else None
    if requirement is None:
        requirement = (
            db.query(Requirement).filter(Requirement.req_key == raw_id).first()
        )
    return requirement


def _retire_current_analyses(db, version: RequirementVersion) -> None:
    """Supersede prior current rows for one version (same transaction).

    Frees the partial unique slot (requirement_version_id WHERE
    is_current) and excludes stale rows from link derivation, which
    ignores ``freshness == "superseded"`` artifacts. Only GENERATED
    scripts are retired; manual/imported rows stay for human
    revalidation (spec 6.2, accept transition).
    """
    prior = (
        db.query(RiskAssessment)
        .filter(
            RiskAssessment.requirement_version_id == version.id,
            RiskAssessment.is_current.is_(True),
        )
        .all()
    )
    for old in prior:
        old.is_current = False
        old.freshness = "superseded"
        old.status = "SUPERSEDED"
    db.flush()
    for old in prior:
        db.query(AssuranceDecision).filter(
            AssuranceDecision.risk_assessment_id == old.id,
            AssuranceDecision.freshness != "superseded",
        ).update({"freshness": "superseded"}, synchronize_session=False)
        db.query(TestScript).filter(
            TestScript.requirement_version_id == version.id,
            TestScript.freshness != "superseded",
            TestScript.origin == "generated",
        ).update({"freshness": "superseded"}, synchronize_session=False)
    db.flush()


@router.post(
    "/{requirement_id}/run",
    status_code=201,
    response_model=AssessmentRunResponse,
)
def run_assessment(requirement_id: str, db: DBSession):
    """On-demand analysis of a requirement's current version.

    Real path only: current version text -> ``extract_evidence`` (Bedrock)
    -> ``assess_evidence`` -> assurance gate -> persistence + link sync.
    Script generation is a separate user-triggered action for scripted
    decisions only.
    """
    requirement = _resolve_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(
            status_code=404, detail=f"requirement {requirement_id} not found"
        )
    version = (
        db.get(RequirementVersion, requirement.current_version_id)
        if requirement.current_version_id is not None
        else None
    )
    if version is None:
        raise HTTPException(
            status_code=409, detail=f"requirement {requirement_id} has no versions"
        )
    usage_log = []
    try:
        _retire_current_analyses(db, version)
        outcome = run_full_analysis(
            db,
            version,
            version.text,
            extract_evidence,
            generate_test_script,
            usage_log=usage_log,
            generate_script=False,
        )
        sync_links(
            db, requirement_ids={str(requirement.id)}, created_by="api"
        )
        db.commit()
    except HTTPException:
        raise
    except RuntimeError as exc:
        db.rollback()
        _save_failed_usage(db, version, usage_log, str(exc))
        raise HTTPException(
            status_code=503, detail=f"analysis provider unavailable: {exc}"
        ) from exc
    except Exception as exc:
        db.rollback()
        _save_failed_usage(db, version, usage_log, str(exc))
        raise HTTPException(status_code=500, detail=f"analysis failed: {exc}") from exc

    risk = db.get(RiskAssessment, UUID(str(outcome["risk_assessment_id"])))
    decision = (
        db.query(AssuranceDecision)
        .filter(AssuranceDecision.risk_assessment_id == risk.id)
        .order_by(AssuranceDecision.created_at.desc())
        .first()
    )
    script = (
        db.query(TestScript)
        .filter(TestScript.assurance_decision_id == decision.id)
        .order_by(TestScript.created_at.desc())
        .first()
        if decision is not None
        else None
    )
    return {
        "requirement_id": str(requirement.id),
        "requirement_key": requirement.req_key,
        "requirement_version_id": str(version.id),
        "version": version.version_number,
        "risk_assessment": _serialise(risk),
        "assurance_decision": (
            {
                "id": str(decision.id),
                "assurance_level": getattr(
                    decision.assurance_level, "value", decision.assurance_level
                ),
                "generate_test": decision.generate_test,
                "rule_id": decision.rule_id,
                "rule_version": decision.rule_version,
                "reasoning": decision.reasoning,
                "freshness": decision.freshness,
            }
            if decision is not None
            else None
        ),
        "test_script": (
            {
                "id": str(script.id),
                "script": script.script,
                "status": getattr(script.status, "value", script.status),
                "freshness": script.freshness,
            }
            if script is not None
            else None
        ),
        "token_usage": _token_usage_summary(db, version.id),
    }


@router.post(
    "/{requirement_id}/generate-script",
    status_code=201,
    response_model=GenerateScriptResponse,
)
def generate_script_for_requirement(requirement_id: str, db: DBSession):
    """Generate a test script only after explicit request for scripted assurance."""
    requirement = _resolve_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(
            status_code=404, detail=f"requirement {requirement_id} not found"
        )
    version = (
        db.get(RequirementVersion, requirement.current_version_id)
        if requirement.current_version_id is not None
        else None
    )
    if version is None:
        raise HTTPException(
            status_code=409, detail=f"requirement {requirement_id} has no versions"
        )
    risk = (
        db.query(RiskAssessment)
        .filter(
            RiskAssessment.requirement_version_id == version.id,
            RiskAssessment.is_current.is_(True),
            RiskAssessment.freshness != "superseded",
        )
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )
    if risk is None:
        raise HTTPException(
            status_code=409, detail="Run risk and assurance analysis first."
        )
    decision = (
        db.query(AssuranceDecision)
        .filter(
            AssuranceDecision.risk_assessment_id == risk.id,
            AssuranceDecision.freshness != "superseded",
        )
        .order_by(AssuranceDecision.created_at.desc())
        .first()
    )
    if decision is None or not decision.generate_test:
        raise HTTPException(
            status_code=409,
            detail="Test script generation is available only for scripted assurance.",
        )
    existing = (
        db.query(TestScript)
        .filter(
            TestScript.assurance_decision_id == decision.id,
            TestScript.origin == "generated",
            TestScript.freshness != "superseded",
        )
        .order_by(TestScript.created_at.desc())
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="A generated script already exists for this assurance decision.",
        )

    usage_log = []
    try:
        script, _usage = generate_and_save_script(
            db,
            version,
            decision,
            version.text,
            generate_test_script,
            usage_log,
        )
        sync_links(db, requirement_ids={str(requirement.id)}, created_by="api")
        db.commit()
    except RuntimeError as exc:
        db.rollback()
        _save_failed_usage(db, version, [], str(exc), script_entries=usage_log)
        raise HTTPException(
            status_code=503, detail=f"script provider unavailable: {exc}"
        ) from exc
    except Exception as exc:
        db.rollback()
        _save_failed_usage(db, version, [], str(exc), script_entries=usage_log)
        raise HTTPException(
            status_code=500, detail=f"script generation failed: {exc}"
        ) from exc

    return {
        "requirement_id": str(requirement.id),
        "requirement_key": requirement.req_key,
        "requirement_version_id": str(version.id),
        "test_script": {
            "id": str(script.id),
            "script": script.script,
            "status": getattr(script.status, "value", script.status),
            "freshness": script.freshness,
        },
        "token_usage": _token_usage_summary(db, version.id),
    }


def _token_usage_summary(db, version_id) -> dict:
    rows = (
        db.query(TokenUsage)
        .filter(TokenUsage.requirement_version_id == version_id)
        .all()
    )
    return {
        "run_count": len(rows),
        "input_tokens": sum(row.input_tokens for row in rows),
        "output_tokens": sum(row.output_tokens for row in rows),
        "total_tokens": sum(row.total_tokens for row in rows),
    }


def _save_failed_usage(
    db,
    version,
    usage_log: list[dict],
    error: str,
    script_entries: list[dict] | None = None,
) -> None:
    if not usage_log and not script_entries:
        return
    extraction = [row for row in usage_log if row["stage"] == "evidence_extraction"]
    script = (
        script_entries
        if script_entries is not None
        else [row for row in usage_log if row["stage"] == "test_script_generation"]
    )
    if script_entries is not None:
        script = [{**row, "stage": "test_script_generation"} for row in script]
    save_token_usage(db, version, extraction, script, "FAILED", error)
    db.commit()
