"""Shared helpers for the v1 endpoints."""

from __future__ import annotations

from fastapi import HTTPException

from app.services.traceability.ids import coerce_uuid


def get_or_404(session, model, raw_id: str, name: str):
    """Fetch by UUID primary key; 404 on bad format or missing row."""
    try:
        key = coerce_uuid(raw_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=f"{name} not found") from exc
    row = session.get(model, key)
    if row is None:
        raise HTTPException(status_code=404, detail=f"{name} not found")
    return row


def optional_uuid(raw: str | None):
    """Coerce an optional query param; 400 on bad format."""
    if raw is None:
        return None
    try:
        return coerce_uuid(raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"invalid UUID: {raw!r}") from exc
