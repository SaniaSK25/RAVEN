"""Assurance-decision list endpoint (read-only).

Returns persisted AssuranceDecision rows with their requirement identity and
persisted verdict values. Nothing is decided here: the level / rule /
reasoning / decision path are read verbatim, risk context (band / RPN /
severity) is read from the linked RiskAssessment, and freshness /
current-version flags are exposed so callers preserve traceability semantics.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.db.dependencies import DBSession
from app.models.assurance_decision import AssuranceDecision
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment

router = APIRouter(prefix="/assurance", tags=["Assurance"])


def _serialise(decision: AssuranceDecision) -> dict:
    assessment = decision.risk_assessment
    version = assessment.requirement_version if assessment is not None else None
    requirement = version.requirement if version is not None else None
    severity = (
        assessment.severity_result
        if assessment is not None and assessment.severity_result is not None
        else None
    )
    return {
        "id": str(decision.id),
        "risk_assessment_id": str(decision.risk_assessment_id),
        "requirement_id": str(requirement.id) if requirement is not None else None,
        "requirement_key": requirement.req_key if requirement is not None else None,
        "requirement_title": requirement.title if requirement is not None else None,
        "requirement_version_id": (
            str(assessment.requirement_version_id) if assessment is not None else None
        ),
        "version": version.version_number if version is not None else None,
        "current_requirement_version": (
            requirement.current_version.version_number
            if requirement is not None and requirement.current_version is not None
            else None
        ),
        "is_current_version": bool(version.is_current) if version is not None else False,
        "assurance_level": getattr(
            decision.assurance_level, "value", decision.assurance_level
        ),
        "rule_id": decision.rule_id,
        "rule_version": decision.rule_version,
        "generate_test": decision.generate_test,
        "reasoning": decision.reasoning,
        "decision_path": decision.decision_path,
        "freshness": decision.freshness,
        "assessment_freshness": assessment.freshness if assessment is not None else None,
        "severity": severity.score if severity is not None else None,
        "rpn": assessment.rpn if assessment is not None else None,
        "rpn_points": assessment.rpn_points if assessment is not None else None,
        "gxp_impact": assessment.gxp_impact if assessment is not None else None,
        "gamp_category": assessment.gamp_category if assessment is not None else None,
        "band": (
            getattr(assessment.band, "value", assessment.band)
            if assessment is not None
            else None
        ),
        "created_at": (
            decision.created_at.isoformat() if decision.created_at else None
        ),
    }


@router.get("")
def list_decisions(
    db: DBSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    freshness: str | None = Query(default=None),
    requirement_key: str | None = Query(default=None),
    include_superseded: bool = Query(default=False),
):
    query = (
        db.query(AssuranceDecision)
        .join(
            RiskAssessment,
            AssuranceDecision.risk_assessment_id == RiskAssessment.id,
        )
        .join(
            RequirementVersion,
            RiskAssessment.requirement_version_id == RequirementVersion.id,
        )
        .join(Requirement, RequirementVersion.requirement_id == Requirement.id)
    )
    if not include_superseded:
        query = query.filter(AssuranceDecision.freshness != "superseded")
    if freshness:
        query = query.filter(AssuranceDecision.freshness == freshness)
    if requirement_key:
        query = query.filter(Requirement.req_key == requirement_key)
    query = query.order_by(AssuranceDecision.created_at.desc())
    total = query.count()
    rows = query.offset(skip).limit(limit).all()
    return {
        "items": [_serialise(row) for row in rows],
        "total": total,
        "skip": skip,
        "limit": limit,
    }
