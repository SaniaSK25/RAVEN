"""Traceability endpoints: matrix, graph, orphans, links, import, rebuild."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel

from app.api.v1.endpoints.helpers import get_or_404
from app.db.dependencies import DBSession
from app.services.traceability.graph import build_graph
from app.services.traceability.io import snapshot_from_db
from app.services.traceability.matrix import (
    MATRIX_COLUMNS,
    build_matrix,
    matrix_to_csv,
    parse_import_csv,
)
from app.services.traceability.orphans import find_orphans, orphan_summary
from app.services.traceability.sync import rebuild_links, sync_links
from app.services.traceability.trace_import import apply_import

router = APIRouter(prefix="/traceability", tags=["Traceability"])

_VALID_EDGES = {
    ("has_risk", "requirement", "risk"),
    ("assessed_as", "risk", "assurance"),
    ("mitigated_by", "assurance", "test"),
    ("verifies", "test", "requirement"),
}


class LinkCreate(BaseModel):
    src_type: str
    src_id: str
    dst_type: str
    dst_id: str
    link_type: str
    created_by: str = "api"


class ImportPayload(BaseModel):
    content: str
    mode: str = "merge"
    created_by: str = "api"


def _serialise_link(row) -> dict:
    return {
        "id": str(row.id),
        "src_type": row.src_type,
        "src_id": row.src_id,
        "dst_type": row.dst_type,
        "dst_id": row.dst_id,
        "link_type": row.link_type,
        "origin": row.origin,
        "active": bool(row.active),
        "suppressed": bool(row.suppressed),
        "stale": bool(row.stale),
        "created_by": row.created_by,
    }


@router.get("/matrix")
def get_matrix(db: DBSession):
    snapshot = snapshot_from_db(db)
    orphans = find_orphans(snapshot)
    rows = build_matrix(snapshot, orphans)
    return {"columns": list(MATRIX_COLUMNS), "rows": rows, "total": len(rows)}


@router.get("/matrix/export")
def export_matrix(db: DBSession):
    snapshot = snapshot_from_db(db)
    rows = build_matrix(snapshot, find_orphans(snapshot))
    csv_text = matrix_to_csv(rows)
    return Response(
        content=csv_text.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=traceability-matrix.csv"},
    )


@router.get("/graph")
def get_graph(
    db: DBSession,
    requirement_key: str | None = Query(default=None),
    include_inactive: bool = Query(default=False),
):
    snapshot = snapshot_from_db(db)
    return build_graph(
        snapshot,
        find_orphans(snapshot),
        requirement_key=requirement_key,
        include_inactive=include_inactive,
    )


@router.get("/orphans")
def get_orphans(db: DBSession):
    orphans = find_orphans(snapshot_from_db(db))
    return {
        "orphans": [o.__dict__ for o in orphans],
        "summary": orphan_summary(orphans),
    }


@router.post("/links", status_code=201)
def create_link(payload: LinkCreate, db: DBSession):
    from app.models.trace_link import TraceLink

    if (payload.link_type, payload.src_type, payload.dst_type) not in _VALID_EDGES:
        raise HTTPException(
            status_code=400, detail="invalid endpoint types for link_type"
        )
    snapshot = snapshot_from_db(db)
    for node_type, node_id in (
        (payload.src_type, payload.src_id),
        (payload.dst_type, payload.dst_id),
    ):
        store = {
            "requirement": snapshot.requirements,
            "risk": snapshot.risks,
            "assurance": snapshot.decisions,
            "test": snapshot.tests,
        }[node_type]
        if node_id not in store:
            raise HTTPException(
                status_code=404, detail=f"{node_type} {node_id} not found"
            )

    duplicate = (
        db.query(TraceLink)
        .filter(
            TraceLink.src_type == payload.src_type,
            TraceLink.src_id == payload.src_id,
            TraceLink.dst_type == payload.dst_type,
            TraceLink.dst_id == payload.dst_id,
            TraceLink.link_type == payload.link_type,
        )
        .first()
    )
    if duplicate is not None:
        # Same edge already stored (any origin): idempotent return.
        return _serialise_link(duplicate)
    try:
        row = TraceLink(
            src_type=payload.src_type,
            src_id=payload.src_id,
            dst_type=payload.dst_type,
            dst_id=payload.dst_id,
            link_type=payload.link_type,
            origin="manual",
            active=True,
            suppressed=False,
            stale=False,
            created_by=payload.created_by,
        )
        db.add(row)
        db.flush()
        sync_links(db, created_by=payload.created_by)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise_link(row)


@router.delete("/links/{link_id}")
def delete_link(link_id: str, db: DBSession, deleted_by: str = "api"):
    from app.models.trace_link import TraceLink

    row = get_or_404(db, TraceLink, link_id, "link")
    try:
        if row.origin == "system":
            # Suppress: sync must not resurrect it (spec 1.3).
            row.suppressed = True
            row.active = False
        else:
            row.active = False
        sync_links(db, created_by=deleted_by)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise_link(row)


@router.post("/links/{link_id}/restore")
def restore_link(link_id: str, db: DBSession):
    from app.models.trace_link import TraceLink

    row = get_or_404(db, TraceLink, link_id, "link")
    try:
        row.suppressed = False
        row.active = True
        sync_links(db)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialise_link(row)


@router.post("/import")
def import_csv(payload: ImportPayload, db: DBSession):
    try:
        parsed = parse_import_csv(payload.content)
        summary = apply_import(
            db, parsed, mode=payload.mode, created_by=payload.created_by
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return summary


@router.post("/rebuild")
def rebuild(db: DBSession):
    try:
        counts = rebuild_links(db)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return counts
