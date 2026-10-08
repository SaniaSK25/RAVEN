"""Change-event endpoints (spec section 6).

Re-analysis runs through the Agent 1 pipeline seam: the caller supplies
the fresh assessment payload, or the endpoint reuses a current-version
analysis already present in the database. No LLM is called here.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.v1.endpoints.helpers import get_or_404, optional_uuid
from app.db.dependencies import DBSession
from app.models.change_event import ChangeEvent
from app.services.traceability.changediff import compute_diff
from app.services.traceability.changeflow import (
    InvalidStateError,
    apply_accepted,
    apply_confirmed,
    apply_reanalyzed,
)
from app.services.traceability.io import snapshot_from_db
from app.services.traceability.sync import sync_links

router = APIRouter(prefix="/changes", tags=["Changes"])


class ReanalyzePayload(BaseModel):
    assessment: dict | None = None
    created_by: str = "api"


class ConfirmPayload(BaseModel):
    note: str


class AcceptPayload(BaseModel):
    note: str | None = None


def _serialise(event: ChangeEvent) -> dict:
    return {
        "id": str(event.id),
        "requirement_id": str(event.requirement_id),
        "kind": event.kind,
        "status": event.status,
        "impact": event.impact,
        "diff": event.diff,
        "baseline_assessment_id": event.baseline_assessment_id,
        "carried_from_event_id": str(event.carried_from_event_id)
        if event.carried_from_event_id
        else None,
        "resolution_note": event.resolution_note,
        "resolved_at": event.resolved_at.isoformat() if event.resolved_at else None,
        "created_by": event.created_by,
    }


def _baseline_dict(snapshot, baseline_id: str | None) -> dict | None:
    if not baseline_id or baseline_id not in snapshot.risks:
        return None
    risk = snapshot.risks[baseline_id]
    decision = next(
        (
            d
            for d in snapshot.decisions.values()
            if d.assessment_id == baseline_id and d.freshness != "superseded"
        ),
        None,
    )
    return {
        "severity": risk.severity,
        "probability": risk.probability,
        "detectability": risk.detectability,
        "rpn": risk.rpn,
        "band": risk.band,
        "gxp_impact": None,
        "gamp_category": None,
        "level": decision.level if decision else None,
        "reason_code": decision.reason_code if decision else None,
    }


def _current_analysis(snapshot, requirement_id: str) -> dict | None:
    for risk in snapshot.risks.values():
        if (
            risk.requirement_id != requirement_id
            or not risk.is_current_version
            or risk.freshness == "superseded"
        ):
            continue
        decision = next(
            (
                d
                for d in snapshot.decisions.values()
                if d.assessment_id == risk.id and d.freshness != "superseded"
            ),
            None,
        )
        if decision is None:
            continue
        return {
            "severity": risk.severity,
            "probability": risk.probability,
            "detectability": risk.detectability,
            "rpn": risk.rpn,
            "band": risk.band,
            "gxp_impact": None,
            "gamp_category": None,
            "level": decision.level,
            "reason_code": decision.reason_code,
        }
    return None


@router.get("")
def list_events(
    db: DBSession, requirement_id: str | None = None, status: str | None = None
):
    query = db.query(ChangeEvent).order_by(ChangeEvent.created_at.desc())
    coerced = optional_uuid(requirement_id)
    if coerced:
        query = query.filter(ChangeEvent.requirement_id == coerced)
    if status:
        query = query.filter(ChangeEvent.status == status)
    return [_serialise(e) for e in query.all()]


@router.get("/{event_id}")
def get_event(event_id: str, db: DBSession):
    return _serialise(get_or_404(db, ChangeEvent, event_id, "change event"))


@router.post("/{event_id}/reanalyze")
def reanalyze(event_id: str, payload: ReanalyzePayload, db: DBSession):
    event = get_or_404(db, ChangeEvent, event_id, "change event")
    snapshot = snapshot_from_db(db)
    after = payload.assessment or _current_analysis(snapshot, str(event.requirement_id))
    if after is None:
        raise HTTPException(
            status_code=409,
            detail="no_analysis: no current-version analysis found; "
            "supply assessment payload or run the analysis pipeline first",
        )
    before = _baseline_dict(snapshot, event.baseline_assessment_id)
    try:
        apply_reanalyzed(event, compute_diff(before, after))
        sync_links(
            db,
            requirement_ids={str(event.requirement_id)},
            created_by=payload.created_by,
        )
        db.commit()
    except InvalidStateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(event)


@router.post("/{event_id}/confirm-valid")
def confirm_valid(event_id: str, payload: ConfirmPayload, db: DBSession):
    event = get_or_404(db, ChangeEvent, event_id, "change event")
    try:
        snapshot = snapshot_from_db(db)
        current = _current_analysis(snapshot, str(event.requirement_id))
        from app.models.requirement import Requirement

        requirement = db.get(Requirement, event.requirement_id)
        new_version_id = requirement.current_version_id if requirement else None
        new_decision_id = None
        if current:
            for decision in snapshot.decisions.values():
                risk = snapshot.risks.get(decision.assessment_id)
                if (
                    risk
                    and risk.requirement_id == str(event.requirement_id)
                    and risk.is_current_version
                    and decision.freshness != "superseded"
                ):
                    new_decision_id = decision.id
        apply_confirmed(
            db,
            event,
            payload.note,
            new_version_id=new_version_id,
            new_decision_id=new_decision_id,
        )
        sync_links(db, requirement_ids={str(event.requirement_id)})
        db.commit()
    except InvalidStateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(event)


@router.post("/{event_id}/accept")
def accept(event_id: str, payload: AcceptPayload, db: DBSession):
    event = get_or_404(db, ChangeEvent, event_id, "change event")
    try:
        apply_accepted(db, event, payload.note)
        sync_links(db, requirement_ids={str(event.requirement_id)})
        db.commit()
    except InvalidStateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(event)
