"""Read-only, requirement-version-scoped export dataset.

The export is intentionally assembled in one request so every PDF in a pack
comes from the same selected requirement versions.  The database identifiers
remain in the payload for provenance and for the ZIP metadata crosswalk; the
reader-facing PDFs use report-scoped references instead.
"""

from __future__ import annotations

import hashlib
from collections import Counter
from dataclasses import asdict
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.db.dependencies import DBSession
from app.models.assurance_decision import AssuranceDecision
from app.models.change_event import ChangeEvent
from app.models.compliance_result import ComplianceResult
from app.models.requirement import Requirement
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.services.traceability.io import snapshot_from_db
from app.services.traceability.matrix import MATRIX_COLUMNS, build_matrix
from app.services.traceability.orphans import find_orphans
from app.services.traceability.snapshot import TraceSnapshot

router = APIRouter(prefix="/validation-pack", tags=["Validation export"])


def _enum(value):
    return getattr(value, "value", value)


def _iso(value):
    return value.isoformat() if value else None


def _triple(result):
    if result is None:
        return None
    return {
        "score": result.score,
        "rule_id": result.rule_id,
        "rule_version": getattr(result, "rule_version", None),
        "reasoning": result.reasoning,
        "decision_path": result.decision_path or [],
        "weighted_sum": getattr(result, "weighted_sum", None),
        "gamp_modifier": getattr(result, "gamp_modifier", None),
        "controls_floor": getattr(result, "controls_floor", None),
    }


def _evidence(row):
    if row is None:
        return None
    fields = {}
    for name in (
        "patient_safety",
        "product_quality",
        "batch_release",
        "data_integrity",
        "regulatory_compliance",
        "business_continuity",
        "functional_complexity",
        "dependency_complexity",
        "workflow_complexity",
        "detection_controls",
        "traceability",
        "failure_visibility",
        "gxp_impact",
        "gamp_category",
    ):
        fields[name] = {
            "value": _enum(getattr(row, f"{name}_value")),
            "confidence": getattr(row, f"{name}_confidence"),
            "evidence": getattr(row, f"{name}_evidence"),
        }
    fields["gxp_reason"] = row.gxp_reason
    fields["gamp_reason"] = row.gamp_reason
    return {
        "id": str(row.id),
        "requirement_version_id": str(row.requirement_version_id),
        "fields": fields,
        "created_at": _iso(row.created_at),
    }


def _risk(row):
    return {
        "id": str(row.id),
        "requirement_version_id": str(row.requirement_version_id),
        "evidence_id": str(row.evidence_id),
        "evidence": _evidence(row.evidence),
        "status": row.status,
        "is_current": row.is_current,
        "freshness": row.freshness,
        "severity": row.severity_result.score if row.severity_result else None,
        "probability": row.probability_result.score if row.probability_result else None,
        "detectability": (
            row.detectability_result.score if row.detectability_result else None
        ),
        "severity_result": _triple(row.severity_result),
        "probability_result": _triple(row.probability_result),
        "detectability_result": _triple(row.detectability_result),
        "gxp_impact": row.gxp_impact,
        "gxp_reason": row.gxp_reason,
        "gamp_category": row.gamp_category,
        "gamp_reason": row.gamp_reason,
        "rpn": row.rpn,
        "rpn_points": row.rpn_points,
        "band": _enum(row.band),
        "configuration_version": (
            row.rule_config.version if row.rule_config else None
        ),
        "configuration_hash": (
            row.rule_config.config_hash if row.rule_config else None
        ),
        "created_at": _iso(row.created_at),
        "updated_at": _iso(getattr(row, "updated_at", None)),
    }


def _decision(row):
    return {
        "id": str(row.id),
        "risk_assessment_id": str(row.risk_assessment_id),
        "assurance_level": _enum(row.assurance_level),
        "rule_id": row.rule_id,
        "rule_version": row.rule_version,
        "generate_test": row.generate_test,
        "reasoning": row.reasoning,
        "decision_path": row.decision_path,
        "freshness": row.freshness,
        "created_at": _iso(row.created_at),
    }


def _test(row):
    prompt = row.prompt_version
    return {
        "id": str(row.id),
        "title": row.title,
        "external_code": row.external_code,
        "requirement_version_id": str(row.requirement_version_id),
        "assurance_decision_id": (
            str(row.assurance_decision_id) if row.assurance_decision_id else None
        ),
        "status": _enum(row.status),
        "version": row.version,
        "origin": row.origin,
        "freshness": row.freshness,
        "script": row.script,
        "prompt_version": (
            {
                "id": str(prompt.id),
                "agent_name": prompt.agent_name,
                "version": prompt.version,
                "hash": prompt.hash,
            }
            if prompt
            else None
        ),
        "created_at": _iso(row.created_at),
    }


def _compliance(row):
    prompt = row.prompt_version
    return {
        "id": str(row.id),
        "framework": row.framework,
        "clause": row.clause,
        "status": _enum(row.status),
        "coverage": row.coverage,
        "reasoning": row.reasoning,
        "prompt_version": (
            {
                "id": str(prompt.id),
                "agent_name": prompt.agent_name,
                "version": prompt.version,
                "hash": prompt.hash,
            }
            if prompt
            else None
        ),
        "created_at": _iso(row.created_at),
    }


def _resolve_requirements(db, raw_keys: str | None) -> list[Requirement]:
    if raw_keys is None or not raw_keys.strip():
        raise HTTPException(
            status_code=400,
            detail="Select at least one requirement before generating a validation pack.",
        )
    keys = [part.strip() for part in raw_keys.split(",") if part.strip()]
    if not keys:
        raise HTTPException(status_code=400, detail="No requirement keys were supplied.")

    resolved: list[Requirement] = []
    seen: set[str] = set()
    missing: list[str] = []
    for raw in keys:
        requirement = None
        try:
            requirement = db.get(Requirement, UUID(raw))
        except (ValueError, AttributeError, TypeError):
            requirement = None
        if requirement is None:
            requirement = (
                db.query(Requirement).filter(Requirement.req_key == raw).first()
            )
        if requirement is None:
            missing.append(raw)
            continue
        if str(requirement.id) not in seen:
            seen.add(str(requirement.id))
            resolved.append(requirement)

    if missing:
        raise HTTPException(
            status_code=404,
            detail="Requirement not found: " + ", ".join(sorted(missing)),
        )

    retired = [
        req.req_key or f"REQ-{str(req.id)[:8].upper()}"
        for req in resolved
        if getattr(req.status, "value", req.status) in {"RETIRED", "SUPERSEDED"}
    ]
    if retired:
        raise HTTPException(
            status_code=409,
            detail=(
                "Retired requirements cannot be exported: "
                + ", ".join(sorted(retired))
            ),
        )
    return sorted(resolved, key=lambda req: (req.req_key or "", str(req.id)))


def _scope_snapshot(
    snapshot: TraceSnapshot,
    requirement_ids: set[str],
    version_ids: set[str],
) -> TraceSnapshot:
    """Keep only the selected current versions and their linked artifacts.

    Filtering the snapshot (rather than filtering matrix rows after the fact)
    keeps O2 test rows and O2/O3 findings in scope.  A test with no trace link
    is still included when it belongs to a selected requirement version.
    """

    requirements = {
        node_id: node
        for node_id, node in snapshot.requirements.items()
        if node_id in requirement_ids
    }
    risks = {
        node_id: risk
        for node_id, risk in snapshot.risks.items()
        if risk.requirement_id in requirement_ids
        and risk.requirement_version_id in version_ids
    }
    tests = {
        node_id: test
        for node_id, test in snapshot.tests.items()
        if test.requirement_version_id in version_ids
    }
    decisions = {
        node_id: decision
        for node_id, decision in snapshot.decisions.items()
        if decision.risk_id in risks
    }
    assessments = {
        node_id: assessment
        for node_id, assessment in snapshot.assessments.items()
        if assessment.risk_id in risks
    }

    node_ids = set(requirements) | set(risks) | set(tests) | set(decisions)
    links = [
        link
        for link in snapshot.links
        if link.src_id in node_ids and link.dst_id in node_ids
    ]

    return TraceSnapshot(
        requirements=requirements,
        risks=risks,
        assessments=assessments,
        decisions=decisions,
        tests=tests,
        links=links,
        open_change_requirement_ids=(
            snapshot.open_change_requirement_ids & requirement_ids
        ),
    )


def _pack_reference(items: list[dict]) -> str:
    scope = "|".join(
        sorted(
            f"{item.get('display_key') or item.get('req_key') or item['id']}:"
            f"{item.get('version_id') or 'no-version'}"
            for item in items
        )
    )
    digest = hashlib.sha256(scope.encode("utf-8")).hexdigest()[:8].upper()
    return f"VP-{digest}"


@router.get("")
def get_validation_pack(
    db: DBSession,
    requirement_keys: str | None = Query(default=None),
):
    requirements = _resolve_requirements(db, requirement_keys)

    items: list[dict] = []
    selected_version_ids: set[str] = set()
    selected_requirement_ids: set[str] = set()
    version_by_key: dict[str, int | None] = {}

    for req in requirements:
        selected_requirement_ids.add(str(req.id))
        version = req.current_version
        if version is not None:
            selected_version_ids.add(str(version.id))

        risks = (
            db.query(RiskAssessment)
            .filter(RiskAssessment.requirement_version_id == version.id)
            .order_by(RiskAssessment.created_at.asc(), RiskAssessment.id.asc())
            .all()
            if version is not None
            else []
        )
        decisions = (
            db.query(AssuranceDecision)
            .join(RiskAssessment)
            .filter(RiskAssessment.requirement_version_id == version.id)
            .order_by(AssuranceDecision.created_at.asc(), AssuranceDecision.id.asc())
            .all()
            if version is not None
            else []
        )
        tests = (
            db.query(TestScript)
            .filter(TestScript.requirement_version_id == version.id)
            .order_by(TestScript.created_at.asc(), TestScript.id.asc())
            .all()
            if version is not None
            else []
        )
        compliance = (
            db.query(ComplianceResult)
            .filter(ComplianceResult.requirement_version_id == version.id)
            .order_by(ComplianceResult.created_at.asc(), ComplianceResult.id.asc())
            .all()
            if version is not None
            else []
        )

        display_key = req.req_key or f"REQ-{str(req.id)[:8].upper()}"
        version_number = version.version_number if version is not None else None
        version_by_key[display_key] = version_number
        items.append(
            {
                "id": str(req.id),
                "req_key": req.req_key,
                "display_key": display_key,
                "title": req.description,
                "requirement_title": req.title,
                "status": _enum(req.status),
                "version_id": str(version.id) if version is not None else None,
                "version": version_number,
                "text": version.text if version is not None else req.description,
                "version_created_at": _iso(version.created_at) if version else None,
                "risks": [_risk(row) for row in risks],
                "evidence": [_evidence(row) for row in version.evidence]
                if version is not None
                else [],
                "assurance": [_decision(row) for row in decisions],
                "tests": [_test(row) for row in tests],
                "compliance": [_compliance(row) for row in compliance],
                "compliance_evaluated": bool(compliance),
            }
        )

    snapshot = _scope_snapshot(
        snapshot_from_db(db),
        selected_requirement_ids,
        selected_version_ids,
    )
    orphans = find_orphans(snapshot)
    rows = build_matrix(snapshot, orphans)
    for row in rows:
        key = row.get("requirement_id")
        if key in version_by_key:
            row["requirement_version"] = version_by_key[key] or ""

    changes = []
    if selected_requirement_ids:
        events = (
            db.query(ChangeEvent)
            .filter(
                ChangeEvent.requirement_id.in_(
                    [UUID(requirement_id) for requirement_id in selected_requirement_ids]
                )
            )
            .order_by(ChangeEvent.created_at.desc())
            .all()
        )
        for event in events:
            changes.append(
                {
                    "id": str(event.id),
                    "requirement_id": str(event.requirement_id),
                    "kind": event.kind,
                    "status": event.status,
                    "impact": event.impact,
                    "diff": event.diff,
                    "baseline_assessment_id": event.baseline_assessment_id,
                    "carried_from_event_id": (
                        str(event.carried_from_event_id)
                        if event.carried_from_event_id
                        else None
                    ),
                    "resolution_note": event.resolution_note,
                    "resolved_at": _iso(event.resolved_at),
                    "created_by": event.created_by,
                    "created_at": _iso(event.created_at),
                }
            )

    coverage_by_requirement: dict[str, str] = {}
    for row in rows:
        requirement_id = row.get("requirement_id")
        if requirement_id and requirement_id not in coverage_by_requirement:
            coverage_by_requirement[requirement_id] = row.get("coverage_status", "")

    orphan_counts = Counter(orphan.type for orphan in orphans)
    risk_bands = Counter(
        (risk.get("band") or "Unknown") for item in items for risk in item["risks"]
    )
    assurance_levels = Counter(
        (decision.get("assurance_level") or "Unknown")
        for item in items
        for decision in item["assurance"]
    )
    test_statuses = Counter(
        (test.get("status") or "Unknown") for item in items for test in item["tests"]
    )

    traceability_summary = {
        "requirements": len(items),
        "covered_by_tests": sum(
            1 for value in coverage_by_requirement.values() if value == "covered_by_tests"
        ),
        "covered_by_assurance": sum(
            1
            for value in coverage_by_requirement.values()
            if value == "covered_by_assurance"
        ),
        "uncovered": sum(
            1 for value in coverage_by_requirement.values() if value == "uncovered"
        ),
        "stale": sum(1 for value in coverage_by_requirement.values() if value == "stale"),
        "rows": len(rows),
        "stale_rows": sum(1 for row in rows if row.get("stale") is True),
        "orphans": {
            "O1": orphan_counts.get("O1", 0),
            "O2": orphan_counts.get("O2", 0),
            "O3": orphan_counts.get("O3", 0),
            "total": len(orphans),
        },
    }

    compliance_record_count = sum(len(item["compliance"]) for item in items)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pack_reference": _pack_reference(items),
        "requirements": items,
        "traceability": {
            "columns": list(MATRIX_COLUMNS),
            "rows": rows,
            "summary": traceability_summary,
        },
        "orphans": [asdict(orphan) for orphan in orphans],
        "changes": changes,
        "compliance_evaluated": compliance_record_count > 0,
        "compliance_record_count": compliance_record_count,
        "test_execution_available": False,
        "summary": {
            "requirements": len(items),
            "risk_assessments": sum(len(item["risks"]) for item in items),
            "risk_bands": dict(risk_bands),
            "assurance_levels": dict(assurance_levels),
            "test_statuses": dict(test_statuses),
            "test_scripts": sum(len(item["tests"]) for item in items),
            "evidence_records": sum(len(item["evidence"]) for item in items),
            "changes": len(changes),
            "traceability": traceability_summary,
            "compliance_records": compliance_record_count,
            "compliance_evaluated": compliance_record_count > 0,
            "test_execution_available": False,
        },
    }
