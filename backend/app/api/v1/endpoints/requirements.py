"""Requirement endpoints (minimal Layer 1 + change wiring).

Edit creates a new version (history preserved); delete is a soft-delete
(status RETIRED). Both record a change event, mark impact stale and
sync links in the same transaction. Changed versions automatically trigger
analysis after the edit transaction commits.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Response

from app.db.dependencies import DBSession
from app.db.session import SessionLocal
from app.models.assurance_decision import AssuranceDecision
from app.models.enums import RequirementStatus
from app.models.requirement import Requirement
from app.models.requirement_ingestion_batch import RequirementIngestionBatch
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.token_usage import TokenUsage
from app.schemas.changes import ReanalyzePayload
from app.schemas.requirements import (
    RequirementBatchCreate,
    RequirementCreate,
    RequirementEdit,
)
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
logger = logging.getLogger(__name__)
INGESTION_PROCESSING_TIMEOUT = timedelta(minutes=15)


def _analyze_changed_requirement(requirement_id: str, event_id: str) -> None:
    db = SessionLocal()
    try:
        from app.api.v1.endpoints.assessments import run_assessment
        from app.api.v1.endpoints.changes import reanalyze

        run_assessment(requirement_id, db)
        reanalyze(
            event_id,
            ReanalyzePayload(created_by="automatic-edit-analysis"),
            db,
        )
    except Exception:
        db.rollback()
        logger.exception(
            "Automatic analysis failed for changed requirement %s (change event %s).",
            requirement_id,
            event_id,
        )
    finally:
        db.close()


def _classify_after_requirement_change() -> None:
    from app.api.v1.endpoints.compliance import (
        run_automatic_assessment_after_requirement_change,
    )

    run_automatic_assessment_after_requirement_change()


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
def create(
    payload: RequirementCreate,
    db: DBSession,
    response: Response,
):
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


@router.post("/batch", status_code=201)
def create_requirement_batch(payload: RequirementBatchCreate, db: DBSession):
    """Import every supplied requirement without running analysis."""
    imported = []
    try:
        for item in payload.requirements:
            requirement, created = create_requirement(
                db,
                title=item.req_key or "Requirement",
                description=item.description,
                text=item.text,
                req_key=item.req_key,
                created_by=item.created_by,
            )
            imported.append((requirement, created))

        snapshot = [
            {
                "requirement_id": str(requirement.id),
                "requirement_key": requirement.req_key,
                "reused_existing": not created,
                "source_row": item.source_row,
            }
            for item, (requirement, created) in zip(
                payload.requirements, imported, strict=True
            )
        ]
        batch = RequirementIngestionBatch(
            status="IMPORTED",
            requested_count=len(snapshot),
            requirement_snapshot=json.dumps(snapshot),
            analysis_results="[]",
            token_totals=json.dumps(
                {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
            ),
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _serialize_ingestion_batch(batch)


def _serialize_ingestion_batch(batch: RequirementIngestionBatch) -> dict:
    snapshot = json.loads(batch.requirement_snapshot)
    results = json.loads(batch.analysis_results)
    saved_results = {item["requirement_id"]: item for item in results}
    analysis_results = []
    for imported in snapshot:
        result = saved_results.get(imported["requirement_id"])
        analysis_results.append(
            {
                **(result or {}),
                "requirement_id": imported["requirement_id"],
                "requirement_key": imported["requirement_key"],
                "source_row": imported.get("source_row"),
                "status": result["status"] if result else "PENDING",
            }
        )
    return {
        "batch_id": str(batch.id),
        "status": batch.status,
        "requested_count": batch.requested_count,
        "items": snapshot,
        "analysis_results": analysis_results,
        "token_usage": json.loads(batch.token_totals),
        "error": batch.error,
    }


def _recover_stale_ingestion_batch(batch: RequirementIngestionBatch) -> bool:
    if batch.status != "PROCESSING" or batch.updated_at is None:
        return False
    last_updated = batch.updated_at
    if last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=UTC)
    if datetime.now(UTC) - last_updated <= INGESTION_PROCESSING_TIMEOUT:
        return False
    batch.status = "PARTIAL"
    batch.error = "Analysis stopped before the last batch was saved. Resume to continue."
    return True


@router.get("/batch/{batch_id}")
def get_requirement_batch(batch_id: str, db: DBSession):
    try:
        parsed_id = UUID(batch_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Import batch not found.") from exc
    batch = db.get(RequirementIngestionBatch, parsed_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Import batch not found.")
    if _recover_stale_ingestion_batch(batch):
        db.commit()
    return _serialize_ingestion_batch(batch)


@router.post("/batch/{batch_id}/analyze")
def analyze_requirement_batch(batch_id: str, db: DBSession):
    try:
        parsed_id = UUID(batch_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Import batch not found.") from exc
    batch = (
        db.query(RequirementIngestionBatch)
        .filter(RequirementIngestionBatch.id == parsed_id)
        .with_for_update()
        .first()
    )
    if batch is None:
        raise HTTPException(status_code=404, detail="Import batch not found.")
    if batch.status == "PROCESSING" and not _recover_stale_ingestion_batch(batch):
        raise HTTPException(status_code=409, detail="This import batch is already processing.")

    snapshot = json.loads(batch.requirement_snapshot)
    saved_results = {
        item["requirement_id"]: item for item in json.loads(batch.analysis_results)
    }
    pending = []
    failed_pending = []
    seen_requirement_ids = set()
    for imported in snapshot:
        requirement_id = imported["requirement_id"]
        if requirement_id in seen_requirement_ids:
            continue
        seen_requirement_ids.add(requirement_id)
        requirement = db.get(Requirement, UUID(requirement_id))
        if requirement is None or requirement.current_version_id is None:
            saved_results[imported["requirement_id"]] = {
                **imported,
                "status": "FAILED",
                "error": "Requirement or current version no longer exists.",
            }
            continue
        current_analysis = (
            db.query(RiskAssessment)
            .filter(
                RiskAssessment.requirement_version_id
                == requirement.current_version_id,
                RiskAssessment.is_current.is_(True),
                RiskAssessment.freshness != "superseded",
            )
            .first()
        )
        if current_analysis is not None:
            existing_result = saved_results.get(imported["requirement_id"])
            if existing_result is None or existing_result["status"] in {
                "PENDING",
                "FAILED",
            }:
                saved_results[imported["requirement_id"]] = {
                    **imported,
                    "status": "ALREADY_ANALYZED",
                }
            continue
        if saved_results.get(requirement_id, {}).get("status") == "FAILED":
            failed_pending.append(imported)
        else:
            pending.append(imported)

    next_chunk = (pending or failed_pending)[:10]
    batch.error = None
    if next_chunk:
        batch.status = "PROCESSING"
        batch.updated_at = datetime.now(UTC)
        batch.analysis_results = json.dumps(list(saved_results.values()))
        db.commit()
        try:
            from app.api.v1.endpoints.assessments import run_batch_assessment
            from app.schemas.batch_assessments import BatchAssessmentRequest

            result = run_batch_assessment(
                BatchAssessmentRequest(
                    requirement_ids=[item["requirement_id"] for item in next_chunk]
                ),
                db,
            )
            for analysis in result["items"]:
                imported = next(
                    item
                    for item in next_chunk
                    if item["requirement_id"] == analysis["requirement_id"]
                )
                saved_results[analysis["requirement_id"]] = {
                    **imported,
                    **analysis,
                }
            totals = json.loads(batch.token_totals)
            for key in ("input_tokens", "output_tokens", "total_tokens"):
                totals[key] += result["token_usage"][key]
            batch.token_totals = json.dumps(totals)
        except HTTPException as exc:
            batch.status = "PARTIAL"
            batch.error = str(exc.detail)
            batch.analysis_results = json.dumps(list(saved_results.values()))
            db.commit()
            raise
        except Exception as exc:
            db.rollback()
            batch = db.get(RequirementIngestionBatch, parsed_id)
            batch.status = "PARTIAL"
            batch.error = "Analysis failed unexpectedly. Resume to retry the unfinished batch."
            batch.analysis_results = json.dumps(list(saved_results.values()))
            db.commit()
            logger.exception(
                "Unexpected error analyzing ingestion batch %s.",
                batch_id,
            )
            raise HTTPException(
                status_code=500, detail=f"Batch analysis failed: {exc}"
            ) from exc

    batch.analysis_results = json.dumps(list(saved_results.values()))
    failed = any(item.get("status") == "FAILED" for item in saved_results.values())
    remaining = len(pending) + len(failed_pending) > len(next_chunk)
    batch.status = (
        "IMPORTED" if remaining else "PARTIAL" if failed else "COMPLETED"
    )
    db.commit()
    return _serialize_ingestion_batch(batch)


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
def edit(
    requirement_id: str,
    payload: RequirementEdit,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
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
    if outcome["status"] == "changed" and outcome.get("event_id"):
        background_tasks.add_task(
            _analyze_changed_requirement,
            outcome["requirement_id"],
            outcome["event_id"],
        )
        background_tasks.add_task(_classify_after_requirement_change)
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
