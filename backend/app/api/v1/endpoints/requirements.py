"""Requirement endpoints (minimal Layer 1 + change wiring).

Edit creates a new version (history preserved); delete is a soft-delete
(status RETIRED). Both record a change event, mark impact stale and
sync links in the same transaction. No LLM is called here.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.v1.endpoints.helpers import get_or_404
from app.db.dependencies import DBSession
from app.models.requirement import Requirement
from app.services.traceability.requirement_ops import (
    create_requirement,
    delete_requirement,
    edit_requirement,
)

router = APIRouter(prefix="/requirements", tags=["Requirements"])


class RequirementCreate(BaseModel):
    title: str
    description: str
    text: str | None = None
    req_key: str | None = None
    created_by: str = "api"


class RequirementEdit(BaseModel):
    text: str
    edited_by: str = "api"


def _serialise(requirement: Requirement) -> dict:
    return {
        "id": str(requirement.id),
        "req_key": requirement.req_key,
        "title": requirement.title,
        "description": requirement.description,
        "status": getattr(requirement.status, "value", requirement.status),
        "current_version_id": str(requirement.current_version_id)
        if requirement.current_version_id
        else None,
    }


@router.post("", status_code=201)
def create(payload: RequirementCreate, db: DBSession):
    try:
        requirement = create_requirement(
            db,
            title=payload.title,
            description=payload.description,
            text=payload.text,
            req_key=payload.req_key,
            created_by=payload.created_by,
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(requirement)


@router.get("/{requirement_id}")
def get_one(requirement_id: str, db: DBSession):
    return _serialise(get_or_404(db, Requirement, requirement_id, "requirement"))


@router.patch("/{requirement_id}")
def edit(requirement_id: str, payload: RequirementEdit, db: DBSession):
    try:
        outcome = edit_requirement(db, requirement_id, payload.text, payload.edited_by)
        db.commit()
    except KeyError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return outcome


@router.delete("/{requirement_id}")
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
