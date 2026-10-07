"""Test-script endpoints (manual/imported lifecycle + reads)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.v1.endpoints.helpers import get_or_404
from app.db.dependencies import DBSession
from app.models.requirement import Requirement
from app.models.test_script import TestScript
from app.models.trace_link import TraceLink
from app.services.traceability.sync import sync_links
from app.services.traceability.trace_import import _ensure_prompt

router = APIRouter(prefix="/tests", tags=["Tests"])


class ManualTestCreate(BaseModel):
    title: str
    requirement_id: str
    text: str | None = None
    test_type: str = "manual"
    created_by: str = "api"


def _serialise(test: TestScript) -> dict:
    return {
        "id": str(test.id),
        "title": test.title,
        "origin": test.origin,
        "freshness": test.freshness,
        "external_code": test.external_code,
        "requirement_version_id": str(test.requirement_version_id),
        "assurance_decision_id": str(test.assurance_decision_id)
        if test.assurance_decision_id
        else None,
        "status": getattr(test.status, "value", test.status),
        "version": test.version,
    }


@router.get("")
def list_tests(db: DBSession, freshness: str | None = None, origin: str | None = None):
    query = db.query(TestScript)
    if freshness:
        query = query.filter(TestScript.freshness == freshness)
    if origin:
        query = query.filter(TestScript.origin == origin)
    return [_serialise(t) for t in query.all()]


@router.get("/{test_id}")
def get_test(test_id: str, db: DBSession):
    return _serialise(get_or_404(db, TestScript, test_id, "test"))


@router.post("/manual", status_code=201)
def create_manual(payload: ManualTestCreate, db: DBSession):
    requirement = get_or_404(db, Requirement, payload.requirement_id, "requirement")
    if requirement.current_version_id is None:
        raise HTTPException(status_code=409, detail="requirement has no versions")
    try:
        prompt = _ensure_prompt(db)
        test = TestScript(
            requirement_version_id=requirement.current_version_id,
            assurance_decision_id=None,
            prompt_version_id=prompt.id,
            script=payload.text or payload.title,
            status="DRAFT",
            version=1,
            freshness="fresh",
            origin="manual",
            title=payload.title,
        )
        db.add(test)
        db.flush()
        db.add(
            TraceLink(
                src_type="test",
                src_id=str(test.id),
                dst_type="requirement",
                dst_id=str(requirement.id),
                link_type="verifies",
                origin="manual",
                active=True,
                suppressed=False,
                stale=False,
                created_by=payload.created_by,
            )
        )
        sync_links(
            db, requirement_ids={str(requirement.id)}, created_by=payload.created_by
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(test)


@router.delete("/{test_id}")
def delete_test(test_id: str, db: DBSession):
    test = get_or_404(db, TestScript, test_id, "test")
    try:
        test.freshness = "superseded"
        db.query(TraceLink).filter(
            ((TraceLink.src_type == "test") & (TraceLink.src_id == test_id))
            | ((TraceLink.dst_type == "test") & (TraceLink.dst_id == test_id))
        ).update({"active": False}, synchronize_session=False)
        sync_links(db)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(test)


@router.post("/{test_id}/revalidate")
def revalidate(test_id: str, db: DBSession):
    test = get_or_404(db, TestScript, test_id, "test")
    try:
        test.freshness = "fresh"
        sync_links(db)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise(test)
