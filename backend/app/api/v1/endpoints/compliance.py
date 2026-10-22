from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db.dependencies import DBSession
from app.models.requirement import Requirement
from app.schemas.compliance import ComplianceEvaluateRequest, CompliancePromptRequest
from app.services.compliance_evaluator import build_annex11_prompt, evaluate_requirements

router = APIRouter(prefix="/compliance", tags=["Compliance"])


def _requirements(db: DBSession, ids: list[str] | None) -> list[dict[str, str]]:
    query = db.query(Requirement).order_by(Requirement.req_key, Requirement.created_at)
    if ids:
        rows = [row for row in query.all() if str(row.id) in ids or row.req_key in ids]
    else:
        rows = query.all()
    return [
        {"key": row.req_key or f"REQ-{str(row.id)[:8]}", "text": _text(row)}
        for row in rows
        if getattr(row.status, "value", row.status) != "RETIRED"
    ]


def _text(row: Requirement) -> str:
    version = row.current_version
    return (version.text if version is not None else row.description).strip()


@router.get("/rules")
def rules():
    from app.services.compliance_evaluator import ANNEX_11_RULES
    return {"framework": "EU GMP Annex 11", "rules": [{"clause": rule["clause"], "title": rule["title"], "summary": rule["summary"]} for rule in ANNEX_11_RULES]}


@router.post("/evaluate")
def evaluate(payload: ComplianceEvaluateRequest, db: DBSession):
    requirements = _requirements(db, payload.requirement_ids)
    if not requirements:
        raise HTTPException(status_code=400, detail="No active requirements were found for this assessment.")
    result = evaluate_requirements(requirements)
    result["requirement_count"] = len(requirements)
    result["requirements"] = [{"key": item["key"], "text": item["text"]} for item in requirements]
    result["llm_used"] = False
    result["llm_note"] = "This result checks requirement wording only; it is not implementation evidence."
    return result


@router.post("/prompt")
def prompt(payload: CompliancePromptRequest, db: DBSession):
    requirements = _requirements(db, payload.requirement_ids)
    if not requirements:
        raise HTTPException(status_code=400, detail="No active requirements were found for this prompt.")
    return {"framework": "EU GMP Annex 11", "requirement_count": len(requirements), "prompt": build_annex11_prompt(requirements)}
