"""Risk-assessment list endpoint (read-only).

Returns persisted RiskAssessment rows with their requirement identity and
persisted deterministic outputs. No scores are computed here: severity /
probability / detectability come from the linked sub-result rows, the band /
RPN / GxP / GAMP values are read verbatim, and freshness / current-version
flags are exposed so callers preserve traceability semantics.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.exc import SQLAlchemyError

from app.agents.agent_analyzer import extract_evidence, extract_evidence_batch
from app.agents.agent_script_writer import generate_test_script
from app.db.dependencies import DBSession
from app.models.assurance_decision import AssuranceDecision
from app.models.batch_token_usage import BatchTokenUsage
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.token_usage import TokenUsage
from app.schemas.batch_assessments import BatchAssessmentRequest
from app.schemas.responses import (
    AssessmentRunResponse,
    GenerateScriptResponse,
    RiskAssessmentPageResponse,
)
from app.services.assessment import assess_evidence
from app.services.persistence import save_assessment
from app.services.pipeline import (
    PROMPTS,
    ensure_prompt_version,
    generate_and_save_script,
    run_full_analysis,
    save_token_usage,
)
from app.services.traceability.sync import sync_links

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def _serialise(assessment: RiskAssessment) -> dict:
    version = assessment.requirement_version
    requirement = version.requirement if version is not None else None
    severity = assessment.severity_result
    probability = assessment.probability_result
    detectability = assessment.detectability_result
    evidence = assessment.evidence
    rule_config = assessment.rule_config

    def decision_path(result) -> list[dict]:
        if result is None or not isinstance(result.decision_path, list):
            return []
        path = []
        for step in result.decision_path:
            if not isinstance(step, dict):
                continue
            item = dict(step)
            check = item.get("check")
            if isinstance(check, str) and evidence is not None:
                item["confidence"] = getattr(
                    evidence, f"{check}_confidence", None
                )
            path.append(item)
        return path

    return {
        "id": str(assessment.id),
        "requirement_id": str(requirement.id) if requirement is not None else None,
        "requirement_key": requirement.req_key if requirement is not None else None,
        # Preserve the text from the version that was actually assessed. Using
        # the requirement's current description here makes stale v1 rows look
        # like v2 after the requirement is edited.
        "requirement_title": version.text if version is not None else None,
        "requirement_version_id": str(assessment.requirement_version_id),
        "version": version.version_number if version is not None else None,
        "current_requirement_version": (
            requirement.current_version.version_number
            if requirement is not None and requirement.current_version is not None
            else None
        ),
        "is_current_version": bool(version.is_current) if version is not None else False,
        "is_current": bool(assessment.is_current),
        "status": assessment.status,
        "freshness": assessment.freshness,
        "severity": severity.score if severity is not None else None,
        "probability": probability.score if probability is not None else None,
        "detectability": detectability.score if detectability is not None else None,
        "severity_rule_id": severity.rule_id if severity is not None else None,
        "probability_rule_id": probability.rule_id if probability is not None else None,
        "detectability_rule_id": (
            detectability.rule_id if detectability is not None else None
        ),
        "severity_reasoning": severity.reasoning if severity is not None else None,
        "probability_reasoning": (
            probability.reasoning if probability is not None else None
        ),
        "detectability_reasoning": (
            detectability.reasoning if detectability is not None else None
        ),
        "severity_decision_path": decision_path(severity),
        "probability_decision_path": decision_path(probability),
        "detectability_decision_path": decision_path(detectability),
        "gamp_reason": evidence.gamp_reason if evidence is not None else None,
        "rpn": assessment.rpn,
        "rpn_points": assessment.rpn_points,
        "band": getattr(assessment.band, "value", assessment.band),
        "gxp_impact": assessment.gxp_impact,
        "gamp_category": assessment.gamp_category,
        "rule_version": rule_config.version if rule_config is not None else None,
        "created_at": (
            assessment.created_at.isoformat() if assessment.created_at else None
        ),
    }


@router.get("", response_model=RiskAssessmentPageResponse)
def list_assessments(
    db: DBSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    freshness: str | None = Query(default=None),
    requirement_key: str | None = Query(default=None),
    include_superseded: bool = Query(default=False),
):
    query = (
        db.query(RiskAssessment)
        .join(
            RequirementVersion,
            RiskAssessment.requirement_version_id == RequirementVersion.id,
        )
        .join(Requirement, RequirementVersion.requirement_id == Requirement.id)
    )
    if not include_superseded:
        query = query.filter(RiskAssessment.freshness != "superseded")
    if freshness:
        query = query.filter(RiskAssessment.freshness == freshness)
    if requirement_key:
        query = query.filter(Requirement.req_key == requirement_key)
    query = query.order_by(RiskAssessment.created_at.desc())
    total = query.count()
    rows = query.offset(skip).limit(limit).all()
    return {
        "items": [_serialise(row) for row in rows],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


def _resolve_requirement(db, raw_id: str) -> Requirement:
    """Resolve by UUID primary key or human req_key; None when missing."""
    try:
        parsed = UUID(str(raw_id))
    except (ValueError, AttributeError, TypeError):
        parsed = None
    requirement = db.get(Requirement, parsed) if parsed is not None else None
    if requirement is None:
        requirement = (
            db.query(Requirement).filter(Requirement.req_key == raw_id).first()
        )
    return requirement


def _allocate_tokens(total: int, weights: list[int]) -> list[int]:
    """Allocate shared provider usage proportionally while conserving totals."""
    denominator = sum(weights)
    if denominator <= 0:
        raise ValueError("Token allocation weights must have a positive sum.")
    allocations = [(total * weight) // denominator for weight in weights]
    remainder = total - sum(allocations)
    for index in range(remainder):
        allocations[index % len(allocations)] += 1
    return allocations


def _batch_usage_totals(entries: list[dict]) -> dict[str, int]:
    input_tokens = sum(entry.get("input_tokens", 0) for entry in entries)
    output_tokens = sum(entry.get("output_tokens", 0) for entry in entries)
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
    }


@router.post("/batch-run")
def run_batch_assessment(payload: BatchAssessmentRequest, db: DBSession):
    """Assess up to ten current requirement versions with batched LLM extraction.

    Risk and assurance remain deterministic. Script generation is deliberately
    deferred to the existing per-requirement action.
    """
    requirements_by_id: dict[str, Requirement] = {}
    missing: list[str] = []
    for raw_id in payload.requirement_ids:
        requirement = _resolve_requirement(db, raw_id)
        if requirement is None:
            missing.append(raw_id)
        else:
            if str(requirement.id) in requirements_by_id:
                raise HTTPException(
                    status_code=422,
                    detail=f"Requirement {raw_id} duplicates another supplied identifier.",
                )
            requirements_by_id[str(requirement.id)] = requirement
    if missing:
        raise HTTPException(
            status_code=404,
            detail="Requirements not found: " + ", ".join(missing),
        )

    selected = list(requirements_by_id.values())
    versions: dict[str, RequirementVersion] = {}
    for requirement in selected:
        version = (
            db.get(RequirementVersion, requirement.current_version_id)
            if requirement.current_version_id is not None
            else None
        )
        if version is None:
            raise HTTPException(
                status_code=409,
                detail=f"Requirement {requirement.req_key or requirement.id} has no current version.",
            )
        versions[str(requirement.id)] = version

    batch = BatchTokenUsage(status="RUNNING", requested_count=len(selected))
    db.add(batch)
    db.commit()
    batch_id = batch.id
    usage_log: list[dict] = []
    inputs = [(str(req.id), versions[str(req.id)].text) for req in selected]
    try:
        evidence_by_id = extract_evidence_batch(inputs, usage_log=usage_log)
    except RuntimeError as exc:
        db.rollback()
        batch = db.get(BatchTokenUsage, batch_id)
        totals = _batch_usage_totals(usage_log)
        batch.status = "FAILED"
        batch.failed_count = len(selected)
        batch.input_tokens = totals["input_tokens"]
        batch.output_tokens = totals["output_tokens"]
        batch.total_tokens = totals["total_tokens"]
        batch.error = str(exc)
        db.commit()
        raise HTTPException(
            status_code=503, detail=f"batch analysis provider unavailable: {exc}"
        ) from exc
    except Exception as exc:
        db.rollback()
        batch = db.get(BatchTokenUsage, batch_id)
        totals = _batch_usage_totals(usage_log)
        batch.status = "FAILED"
        batch.failed_count = len(selected)
        batch.input_tokens = totals["input_tokens"]
        batch.output_tokens = totals["output_tokens"]
        batch.total_tokens = totals["total_tokens"]
        batch.error = str(exc)
        db.commit()
        raise HTTPException(
            status_code=500, detail=f"batch evidence extraction failed: {exc}"
        ) from exc

    totals = _batch_usage_totals(usage_log)
    batch = db.get(BatchTokenUsage, batch_id)
    batch.input_tokens = totals["input_tokens"]
    batch.output_tokens = totals["output_tokens"]
    batch.total_tokens = totals["total_tokens"]
    db.commit()

    input_allocations = _allocate_tokens(
        totals["input_tokens"], [max(1, len(version.text)) for version in versions.values()]
    )
    output_allocations = _allocate_tokens(
        totals["output_tokens"],
        [
            max(1, len(evidence_by_id[requirement_id].model_dump_json()))
            for requirement_id in versions
        ],
    )

    items = []
    succeeded = 0
    failed = 0
    for index, requirement in enumerate(selected):
        requirement_id = str(requirement.id)
        version = versions[requirement_id]
        allocated_usage = [
            {
                "input_tokens": input_allocations[index],
                "output_tokens": output_allocations[index],
            }
        ]
        try:
            _retire_current_analyses(db, version)
            evidence = evidence_by_id[requirement_id].model_copy(
                update={"requirement_version_id": str(version.id)}
            )
            assessment = assess_evidence(evidence)
            ensure_prompt_version(
                db,
                PROMPTS["extractor_name"],
                PROMPTS["extractor_version"],
                PROMPTS["extractor_text"],
            )
            risk = save_assessment(
                db,
                version,
                evidence,
                assessment,
                prompts=PROMPTS,
                allow_deferred_script=True,
            )
            sync_links(db, requirement_ids={requirement_id}, created_by="batch-api")
            save_token_usage(
                db,
                version,
                allocated_usage,
                [],
                "SUCCEEDED",
                batch_run_id=batch_id,
                usage_basis="batch_estimate",
            )
            db.commit()
            succeeded += 1
            decision = (
                db.query(AssuranceDecision)
                .filter(AssuranceDecision.risk_assessment_id == risk.id)
                .order_by(AssuranceDecision.created_at.desc())
                .first()
            )
            items.append(
                {
                    "requirement_id": requirement_id,
                    "requirement_key": requirement.req_key,
                    "version": version.version_number,
                    "status": "SUCCEEDED",
                    "risk_assessment": {
                        "id": str(risk.id),
                        "severity": assessment["severity"]["score"],
                        "probability": assessment["probability"]["score"],
                        "detectability": assessment["detectability"]["score"],
                        "rpn": assessment["rpn"],
                        "rpn_points": assessment["rpn_points"],
                        "band": assessment["band"].upper(),
                    },
                    "assurance_decision": (
                        {
                            "id": str(decision.id),
                            "assurance_level": getattr(
                                decision.assurance_level,
                                "value",
                                decision.assurance_level,
                            ).upper(),
                            "generate_test": decision.generate_test,
                            "rule_id": decision.rule_id,
                            "reason": decision.reasoning,
                        }
                        if decision is not None
                        else None
                    ),
                    "test_script_generated": False,
                    "token_usage": {
                        "input_tokens": input_allocations[index],
                        "output_tokens": output_allocations[index],
                        "total_tokens": (
                            input_allocations[index] + output_allocations[index]
                        ),
                        "basis": "estimated allocation of exact batch usage",
                    },
                }
            )
        except (
            SQLAlchemyError,
            ValueError,
            TypeError,
            KeyError,
            AttributeError,
            RuntimeError,
        ) as exc:
            db.rollback()
            failed += 1
            error = str(exc)
            version = db.get(RequirementVersion, version.id)
            save_token_usage(
                db,
                version,
                allocated_usage,
                [],
                "FAILED",
                error,
                batch_run_id=batch_id,
                usage_basis="batch_estimate",
            )
            db.commit()
            items.append(
                {
                    "requirement_id": requirement_id,
                    "requirement_key": requirement.req_key,
                    "version": version.version_number,
                    "status": "FAILED",
                    "error": error,
                    "token_usage": {
                        "input_tokens": input_allocations[index],
                        "output_tokens": output_allocations[index],
                        "total_tokens": (
                            input_allocations[index] + output_allocations[index]
                        ),
                        "basis": "estimated allocation of exact batch usage",
                    },
                }
            )
        batch = db.get(BatchTokenUsage, batch_id)
        batch.succeeded_count = succeeded
        batch.failed_count = failed
        batch.status = (
            "SUCCEEDED"
            if failed == 0
            else "FAILED"
            if succeeded == 0
            else "PARTIAL"
        )
        db.commit()

    return {
        "batch_id": str(batch_id),
        "status": batch.status,
        "requested_count": len(selected),
        "succeeded_count": succeeded,
        "failed_count": failed,
        "script_generation": "deferred",
        "token_usage": {
            **totals,
            "basis": "exact provider-reported batch total",
        },
        "items": items,
    }


def _retire_current_analyses(db, version: RequirementVersion) -> None:
    """Supersede prior current rows for one version (same transaction).

    Frees the partial unique slot (requirement_version_id WHERE
    is_current) and excludes stale rows from link derivation, which
    ignores ``freshness == "superseded"`` artifacts. Only GENERATED
    scripts are retired; manual/imported rows stay for human
    revalidation (spec 6.2, accept transition).
    """
    prior = (
        db.query(RiskAssessment)
        .filter(
            RiskAssessment.requirement_version_id == version.id,
            RiskAssessment.is_current.is_(True),
        )
        .all()
    )
    for old in prior:
        old.is_current = False
        old.freshness = "superseded"
        old.status = "SUPERSEDED"
    db.flush()
    for old in prior:
        db.query(AssuranceDecision).filter(
            AssuranceDecision.risk_assessment_id == old.id,
            AssuranceDecision.freshness != "superseded",
        ).update({"freshness": "superseded"}, synchronize_session=False)
        db.query(TestScript).filter(
            TestScript.requirement_version_id == version.id,
            TestScript.freshness != "superseded",
            TestScript.origin == "generated",
        ).update({"freshness": "superseded"}, synchronize_session=False)
    db.flush()


@router.post(
    "/{requirement_id}/run",
    status_code=201,
    response_model=AssessmentRunResponse,
)
def run_assessment(requirement_id: str, db: DBSession):
    """On-demand analysis of a requirement's current version.

    Real path only: current version text -> ``extract_evidence`` (Bedrock)
    -> ``assess_evidence`` -> assurance gate -> persistence + link sync.
    Script generation is a separate user-triggered action for scripted
    decisions only.
    """
    requirement = _resolve_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(
            status_code=404, detail=f"requirement {requirement_id} not found"
        )
    version = (
        db.get(RequirementVersion, requirement.current_version_id)
        if requirement.current_version_id is not None
        else None
    )
    if version is None:
        raise HTTPException(
            status_code=409, detail=f"requirement {requirement_id} has no versions"
        )
    usage_log = []
    try:
        _retire_current_analyses(db, version)
        outcome = run_full_analysis(
            db,
            version,
            version.text,
            extract_evidence,
            generate_test_script,
            usage_log=usage_log,
            generate_script=False,
        )
        sync_links(
            db, requirement_ids={str(requirement.id)}, created_by="api"
        )
        db.commit()
    except HTTPException:
        raise
    except RuntimeError as exc:
        db.rollback()
        _save_failed_usage(db, version, usage_log, str(exc))
        raise HTTPException(
            status_code=503, detail=f"analysis provider unavailable: {exc}"
        ) from exc
    except Exception as exc:
        db.rollback()
        _save_failed_usage(db, version, usage_log, str(exc))
        raise HTTPException(status_code=500, detail=f"analysis failed: {exc}") from exc

    risk = db.get(RiskAssessment, UUID(str(outcome["risk_assessment_id"])))
    decision = (
        db.query(AssuranceDecision)
        .filter(AssuranceDecision.risk_assessment_id == risk.id)
        .order_by(AssuranceDecision.created_at.desc())
        .first()
    )
    script = (
        db.query(TestScript)
        .filter(TestScript.assurance_decision_id == decision.id)
        .order_by(TestScript.created_at.desc())
        .first()
        if decision is not None
        else None
    )
    return {
        "requirement_id": str(requirement.id),
        "requirement_key": requirement.req_key,
        "requirement_version_id": str(version.id),
        "version": version.version_number,
        "risk_assessment": _serialise(risk),
        "assurance_decision": (
            {
                "id": str(decision.id),
                "assurance_level": getattr(
                    decision.assurance_level, "value", decision.assurance_level
                ),
                "generate_test": decision.generate_test,
                "rule_id": decision.rule_id,
                "rule_version": decision.rule_version,
                "reasoning": decision.reasoning,
                "freshness": decision.freshness,
            }
            if decision is not None
            else None
        ),
        "test_script": (
            {
                "id": str(script.id),
                "script": script.script,
                "status": getattr(script.status, "value", script.status),
                "freshness": script.freshness,
            }
            if script is not None
            else None
        ),
        "token_usage": _token_usage_summary(db, version.id),
    }


@router.post(
    "/{requirement_id}/generate-script",
    status_code=201,
    response_model=GenerateScriptResponse,
)
def generate_script_for_requirement(requirement_id: str, db: DBSession):
    """Generate a test script only after explicit request for scripted assurance."""
    requirement = _resolve_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(
            status_code=404, detail=f"requirement {requirement_id} not found"
        )
    version = (
        db.get(RequirementVersion, requirement.current_version_id)
        if requirement.current_version_id is not None
        else None
    )
    if version is None:
        raise HTTPException(
            status_code=409, detail=f"requirement {requirement_id} has no versions"
        )
    risk = (
        db.query(RiskAssessment)
        .filter(
            RiskAssessment.requirement_version_id == version.id,
            RiskAssessment.is_current.is_(True),
            RiskAssessment.freshness != "superseded",
        )
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )
    if risk is None:
        raise HTTPException(
            status_code=409, detail="Run risk and assurance analysis first."
        )
    decision = (
        db.query(AssuranceDecision)
        .filter(
            AssuranceDecision.risk_assessment_id == risk.id,
            AssuranceDecision.freshness != "superseded",
        )
        .order_by(AssuranceDecision.created_at.desc())
        .first()
    )
    if decision is None or not decision.generate_test:
        raise HTTPException(
            status_code=409,
            detail="Test script generation is available only for scripted assurance.",
        )
    existing = (
        db.query(TestScript)
        .filter(
            TestScript.assurance_decision_id == decision.id,
            TestScript.origin == "generated",
            TestScript.freshness != "superseded",
        )
        .order_by(TestScript.created_at.desc())
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="A generated script already exists for this assurance decision.",
        )

    usage_log = []
    try:
        script, _usage = generate_and_save_script(
            db,
            version,
            decision,
            version.text,
            generate_test_script,
            usage_log,
        )
        sync_links(db, requirement_ids={str(requirement.id)}, created_by="api")
        db.commit()
    except RuntimeError as exc:
        db.rollback()
        _save_failed_usage(db, version, [], str(exc), script_entries=usage_log)
        raise HTTPException(
            status_code=503, detail=f"script provider unavailable: {exc}"
        ) from exc
    except Exception as exc:
        db.rollback()
        _save_failed_usage(db, version, [], str(exc), script_entries=usage_log)
        raise HTTPException(
            status_code=500, detail=f"script generation failed: {exc}"
        ) from exc

    return {
        "requirement_id": str(requirement.id),
        "requirement_key": requirement.req_key,
        "requirement_version_id": str(version.id),
        "test_script": {
            "id": str(script.id),
            "script": script.script,
            "status": getattr(script.status, "value", script.status),
            "freshness": script.freshness,
        },
        "token_usage": _token_usage_summary(db, version.id),
    }


def _token_usage_summary(db, version_id) -> dict:
    rows = (
        db.query(TokenUsage)
        .filter(TokenUsage.requirement_version_id == version_id)
        .all()
    )
    return {
        "run_count": len(rows),
        "input_tokens": sum(row.input_tokens for row in rows),
        "output_tokens": sum(row.output_tokens for row in rows),
        "total_tokens": sum(row.total_tokens for row in rows),
        "usage_basis": (
            "mixed"
            if any(row.usage_basis != rows[0].usage_basis for row in rows[1:])
            else rows[0].usage_basis
            if rows
            else "actual"
        ),
    }


def _save_failed_usage(
    db,
    version,
    usage_log: list[dict],
    error: str,
    script_entries: list[dict] | None = None,
) -> None:
    if not usage_log and not script_entries:
        return
    extraction = [row for row in usage_log if row["stage"] == "evidence_extraction"]
    script = (
        script_entries
        if script_entries is not None
        else [row for row in usage_log if row["stage"] == "test_script_generation"]
    )
    if script_entries is not None:
        script = [{**row, "stage": "test_script_generation"} for row in script]
    save_token_usage(db, version, extraction, script, "FAILED", error)
    db.commit()
