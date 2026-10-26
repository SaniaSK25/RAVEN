"""Requirement endpoints (minimal Layer 1 + change wiring).

Edit creates a new version (history preserved); delete is a soft-delete
(status RETIRED). Both record a change event, mark impact stale and
sync links in the same transaction. No LLM is called here.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response

from app.db.dependencies import DBSession
from app.models.assurance_decision import AssuranceDecision
from app.models.requirement import Requirement
from app.models.enums import RequirementStatus
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.token_usage import TokenUsage
from app.schemas.requirements import RequirementCreate, RequirementEdit
from app.schemas.responses import (
    RequirementCreateResponse,
    RequirementDetailResponse,
    RequirementMutationResponse,
    RequirementPageResponse,
)
from app.services.traceability.requirement_ops import (
    create_requirement,
    delete_requirement,
    edit_requirement,
)

router = APIRouter(prefix="/requirements", tags=["Requirements"])


def _serialise(requirement: Requirement) -> dict:
    current = (
        requirement.current_version
        if requirement.current_version_id is not None
        else None
    )
    versions = sorted(
        requirement.versions,
        key=lambda version: version.version_number,
    )
    version_number = current.version_number if current is not None else 0
    return {
        "id": str(requirement.id),
        "req_key": requirement.req_key,
        "title": requirement.description,
        "description": requirement.description,
        "status": getattr(requirement.status, "value", requirement.status),
        "current_version_id": str(requirement.current_version_id)
        if requirement.current_version_id
        else None,
        "text": current.text if current is not None else requirement.description,
        "version": version_number,
        "created_at": requirement.created_at.isoformat()
        if requirement.created_at
        else None,
        "versions": [
            {
                "version": version.version_number,
                "text": version.text,
                "is_current": version.is_current,
                "created_at": version.created_at.isoformat()
                if version.created_at
                else None,
            }
            for version in versions
        ],
    }


@router.get("", response_model=RequirementPageResponse)
def list_requirements(
    db: DBSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
):
    query = (
        db.query(Requirement)
        .filter(Requirement.status != RequirementStatus.RETIRED)
        .order_by(Requirement.created_at.desc())
    )
    total = query.count()
    rows = query.offset(skip).limit(limit).all()
    return {
        "items": [_serialise(requirement) for requirement in rows],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", status_code=201, response_model=RequirementCreateResponse)
def create(payload: RequirementCreate, db: DBSession, response: Response):
    try:
        requirement, created = create_requirement(
            db,
            title=payload.req_key or "Requirement",
            description=payload.description,
            text=payload.text,
            req_key=payload.req_key,
            created_by=payload.created_by,
        )
        db.commit()
        if not created:
            response.status_code = 200
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {**_serialise(requirement), "reused_existing": not created}


@router.get("/{requirement_id}", response_model=RequirementDetailResponse)
def get_one(requirement_id: str, db: DBSession):
    try:
        parsed_id = UUID(requirement_id)
    except ValueError:
        parsed_id = None
    requirement = db.get(Requirement, parsed_id) if parsed_id is not None else None
    if requirement is None:
        requirement = (
            db.query(Requirement).filter(Requirement.req_key == requirement_id).first()
        )
    if requirement is None:
        raise HTTPException(
            status_code=404, detail=f"requirement {requirement_id} not found"
        )
    if requirement.status == RequirementStatus.RETIRED:
        raise HTTPException(
            status_code=404, detail=f"requirement {requirement_id} not found"
        )
    result = _serialise(requirement)
    risk = None
    if requirement.current_version_id is not None:
        risk = (
            db.query(RiskAssessment)
            .filter(
                RiskAssessment.requirement_version_id
                == requirement.current_version_id,
                RiskAssessment.freshness != "superseded",
            )
            .order_by(RiskAssessment.created_at.desc())
            .first()
        )
    result["risk"] = (
        {
            "id": str(risk.id),
            "severity": risk.severity_result.score
            if risk.severity_result is not None
            else None,
            "probability": risk.probability_result.score
            if risk.probability_result is not None
            else None,
            "detectability": risk.detectability_result.score
            if risk.detectability_result is not None
            else None,
            "rpn": risk.rpn,
            "band": getattr(risk.band, "value", risk.band),
            "freshness": risk.freshness,
        }
        if risk
        else None
    )
    decision = (
        db.query(AssuranceDecision)
        .filter(
            AssuranceDecision.risk_assessment_id == risk.id,
            AssuranceDecision.freshness != "superseded",
        )
        .order_by(AssuranceDecision.created_at.desc())
        .first()
        if risk is not None
        else None
    )
    result["assurance"] = (
        {
            "id": str(decision.id),
            "level": getattr(decision.assurance_level, "value", decision.assurance_level),
            "reason_code": decision.rule_id,
            "label": decision.reasoning,
            "method": decision.decision_path.get("method", "")
            if isinstance(decision.decision_path, dict)
            else "",
            "freshness": decision.freshness,
        }
        if decision
        else None
    )
    result["tests"] = [
        {
            "id": str(test.id),
            "title": test.title,
            "origin": test.origin,
            "freshness": test.freshness,
            "external_code": test.external_code,
            "script": test.script,
        }
        for test in db.query(TestScript)
        .filter(TestScript.requirement_version_id == requirement.current_version_id)
        .all()
    ]
    usage_rows = (
        db.query(TokenUsage)
        .filter(TokenUsage.requirement_version_id == requirement.current_version_id)
        .all()
        if requirement.current_version_id is not None
        else []
    )
    result["token_usage"] = {
        "run_count": len(usage_rows),
        "input_tokens": sum(row.input_tokens for row in usage_rows),
        "output_tokens": sum(row.output_tokens for row in usage_rows),
        "total_tokens": sum(row.total_tokens for row in usage_rows),
    }
    return result


@router.patch("/{requirement_id}", response_model=RequirementMutationResponse)
def edit(requirement_id: str, payload: RequirementEdit, db: DBSession):
    try:
        outcome = edit_requirement(
            db,
            requirement_id,
            payload.text,
            payload.edited_by,
        )
        db.commit()
    except KeyError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return outcome


@router.delete("/{requirement_id}", response_model=RequirementMutationResponse)
def delete(requirement_id: str, db: DBSession, deleted_by: str = "api"):
    try:
        outcome = delete_requirement(db, requirement_id, deleted_by)
        db.commit()
    except KeyError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return outcome
