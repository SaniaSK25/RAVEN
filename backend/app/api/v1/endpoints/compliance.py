"""Manually triggered, batch-based requirement classification endpoints."""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.dependencies import DBSession
from app.db.session import SessionLocal
from app.models.compliance_assessment_run import ComplianceAssessmentRun
from app.models.compliance_batch_usage import ComplianceBatchUsage
from app.models.requirement import Requirement
from app.schemas.compliance import ComplianceEvaluateRequest, CompliancePromptRequest
from app.services import compliance_llm as classifier

router = APIRouter(prefix="/compliance", tags=["Compliance"])
logger = logging.getLogger(__name__)


def _requirements(
    db: Session,
    ids: list[str] | None = None,
) -> list[dict[str, Any]]:
    rows = (
        db.query(Requirement)
        .order_by(Requirement.req_key, Requirement.created_at)
        .all()
    )
    if ids:
        matched_rows = [row for row in rows if str(row.id) in ids or row.req_key in ids]
        matched_ids = {
            value
            for row in matched_rows
            for value in (str(row.id), row.req_key)
            if value is not None
        }
        unknown = set(ids) - matched_ids
        if unknown:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown requirement identifiers: {', '.join(sorted(unknown))}.",
            )
        rows = matched_rows

    requirements = [
        {
            "key": row.req_key or f"REQ-{str(row.id)[:8].upper()}",
            "id": str(row.id),
            "text": (
                row.current_version.text
                if row.current_version is not None
                else row.description
            ).strip(),
            "version_id": str(row.current_version.id),
            "version_number": row.current_version.version_number,
        }
        for row in rows
        if getattr(row.status, "value", row.status) != "RETIRED"
        and row.current_version is not None
    ]
    try:
        classifier.validate_requirement_keys(requirements)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return requirements


def _as_dict(value: str | None) -> dict[str, Any] | None:
    return json.loads(value) if value else None


def _usage_totals(rows: list[ComplianceBatchUsage]) -> dict[str, Any]:
    input_tokens = sum(row.actual_input_tokens or 0 for row in rows)
    output_tokens = sum(row.actual_output_tokens or 0 for row in rows)
    actual_complete = all(
        row.actual_input_tokens is not None and row.actual_output_tokens is not None
        for row in rows
    )
    return {
        "total_batches": len({row.batch_number for row in rows}),
        "estimated_input_tokens": sum(row.estimated_input_tokens for row in rows),
        "actual_input_tokens": input_tokens if actual_complete and rows else None,
        "actual_output_tokens": output_tokens if actual_complete and rows else None,
        "total_actual_tokens": (
            input_tokens + output_tokens if actual_complete and rows else None
        ),
        "actual_usage_complete": actual_complete and bool(rows),
    }


def _serialize_run(run: ComplianceAssessmentRun) -> dict[str, Any]:
    batch_usages = [
        {
            "batch_number": row.batch_number,
            "attempt": row.attempt,
            "requirements_processed": row.requirements_processed,
            "estimated_input_tokens": row.estimated_input_tokens,
            "actual_input_tokens": row.actual_input_tokens,
            "actual_output_tokens": row.actual_output_tokens,
            "model_id": row.model_id,
            "max_output_tokens": row.max_output_tokens,
            "status": row.status,
            "error": row.error,
        }
        for row in run.batch_usages
    ]
    completed = run.status == "COMPLETED"
    result = _as_dict(run.result) if completed else None
    requirements = json.loads(run.requirement_snapshot)
    return {
        "id": str(run.id),
        "assessment_status": run.status,
        "requested_count": run.requested_count,
        "total_batches": run.total_batches,
        "completed_batches": run.completed_batches,
        "current_batch": run.current_batch,
        "requirements_processed": run.requirements_processed,
        "requirements_count": result.get("requirements_count") if result else None,
        "matching_lists_exhaustive": (
            result.get("matching_lists_exhaustive") if result else None
        ),
        "control_areas": result.get("control_areas") if result else None,
        "requirement_routes": {
            requirement["key"]: requirement.get("id", requirement["key"])
            for requirement in requirements
        },
        "token_usage": (
            result.get("token_usage") if result else _usage_totals(run.batch_usages)
        ),
        "batch_usage": batch_usages,
        "error": run.error,
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }


def _persist_invocation(
    db: Session,
    run: ComplianceAssessmentRun,
    invocation: dict[str, Any],
) -> None:
    db.add(
        ComplianceBatchUsage(
            assessment=run,
            assessment_id=run.id,
            batch_number=invocation["batch_number"],
            attempt=invocation["attempt"],
            requirements_processed=invocation["requirements_processed"],
            estimated_input_tokens=invocation["estimated_input_tokens"],
            actual_input_tokens=invocation["actual_input_tokens"],
            actual_output_tokens=invocation["actual_output_tokens"],
            model_id=invocation["model_id"],
            max_output_tokens=invocation["max_output_tokens"],
            status=invocation["status"],
            error=invocation["error"],
        )
    )
    db.flush()
    completed = {
        row.batch_number for row in run.batch_usages if row.status == "COMPLETED"
    }
    run.completed_batches = len(completed)
    run.token_totals = json.dumps(_usage_totals(run.batch_usages))
    db.commit()


def _execute_assessment(run_id: str) -> None:
    db = SessionLocal()
    try:
        run = db.get(ComplianceAssessmentRun, UUID(run_id))
        if run is None:
            logger.error("Requirement classification run %s no longer exists.", run_id)
            return
        requirements = json.loads(run.requirement_snapshot)
        run.status = "RUNNING"
        db.commit()

        def on_progress(batch_number: int, requirement_count: int) -> None:
            run.current_batch = batch_number
            run.requirements_processed = sum(
                row.requirements_processed
                for row in run.batch_usages
                if row.status == "COMPLETED" and row.batch_number < batch_number
            )
            db.commit()

        def on_invocation(invocation: dict[str, Any]) -> None:
            _persist_invocation(db, run, invocation)

        result = classifier.run_classification(
            requirements,
            on_invocation=on_invocation,
            on_batch_progress=on_progress,
            max_output_tokens=settings.COMPLIANCE_MAX_OUTPUT_TOKENS,
            max_input_tokens=settings.COMPLIANCE_MAX_INPUT_TOKENS,
            max_requirements_per_batch=settings.COMPLIANCE_MAX_REQUIREMENTS_PER_BATCH,
        )
        run.result = json.dumps(result)
        run.status = "COMPLETED"
        run.current_batch = None
        run.completed_batches = result["token_usage"]["total_batches"]
        run.requirements_processed = len(requirements)
        run.token_totals = json.dumps(_usage_totals(run.batch_usages))
        run.error = None
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Requirement classification run %s failed.", run_id)
        failed = db.get(ComplianceAssessmentRun, UUID(run_id))
        if failed is not None:
            failed.status = "FAILED"
            failed.current_batch = None
            failed.error = str(exc)
            failed.token_totals = json.dumps(_usage_totals(failed.batch_usages))
            db.commit()
    finally:
        db.close()


@router.get("/rules")
def rules() -> dict[str, Any]:
    """Expose the five configured control-area names and classification criteria."""
    return {
        "control_areas": classifier.CONTROL_AREAS,
        "full_coverage_criterion": settings.COMPLIANCE_FULL_COVERAGE_CRITERION,
        "partial_coverage_criterion": settings.COMPLIANCE_PARTIAL_COVERAGE_CRITERION,
    }


@router.post("/evaluate")
def evaluate(
    payload: ComplianceEvaluateRequest,
    background_tasks: BackgroundTasks,
    db: DBSession,
) -> dict[str, Any]:
    """Create a user-requested assessment; execution continues in the background."""
    requirements = _requirements(db, payload.requirement_ids)
    if not requirements:
        raise HTTPException(
            status_code=400,
            detail="No active requirements with a current version were found.",
        )
    model_id = classifier.configured_model_id()
    try:
        chunks = classifier.chunk_requirements(
            requirements,
            model_id,
            max_input_tokens=settings.COMPLIANCE_MAX_INPUT_TOKENS,
            max_requirements=settings.COMPLIANCE_MAX_REQUIREMENTS_PER_BATCH,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    run = ComplianceAssessmentRun(
        status="QUEUED",
        requested_count=len(requirements),
        total_batches=len(chunks),
        requirement_snapshot=json.dumps(requirements),
        token_totals=json.dumps(
            {
                "total_batches": 0,
                "estimated_input_tokens": 0,
                "actual_input_tokens": 0,
                "actual_output_tokens": 0,
                "total_actual_tokens": None,
                "actual_usage_complete": False,
            }
        ),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    background_tasks.add_task(_execute_assessment, str(run.id))
    return _serialize_run(run)


@router.get("/runs/{run_id}")
def get_run(run_id: str, db: DBSession) -> dict[str, Any]:
    try:
        parsed_id = UUID(run_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid assessment ID.") from exc
    run = db.get(ComplianceAssessmentRun, parsed_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return _serialize_run(run)


@router.get("/report")
def report(db: DBSession) -> dict[str, Any]:
    """Load the latest assessment state without triggering model execution."""
    run = (
        db.query(ComplianceAssessmentRun)
        .order_by(ComplianceAssessmentRun.created_at.desc())
        .first()
    )
    return (
        _serialize_run(run)
        if run is not None
        else {
            "assessment_status": "NOT_RUN",
            "control_areas": None,
            "token_usage": None,
        }
    )


@router.post("/prompt")
def prompt(payload: CompliancePromptRequest, db: DBSession) -> dict[str, Any]:
    requirements = _requirements(db, payload.requirement_ids)
    if not requirements:
        raise HTTPException(
            status_code=400, detail="No active requirements were found."
        )
    try:
        first_batch = classifier.chunk_requirements(
            requirements,
            classifier.configured_model_id(),
            max_input_tokens=settings.COMPLIANCE_MAX_INPUT_TOKENS,
            max_requirements=settings.COMPLIANCE_MAX_REQUIREMENTS_PER_BATCH,
        )[0]
        rendered = classifier.build_review_prompt(first_batch)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "requirement_count": len(requirements),
        "first_batch_requirement_count": len(first_batch),
        "prompt": rendered,
    }
