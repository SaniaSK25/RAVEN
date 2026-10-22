"""Configuration API — band thresholds and recompute preview/apply."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

from app.db.dependencies import DBSession
from app.models.risk_assessment import RiskAssessment
from app.models.requirement_version import RequirementVersion
from app.models.stored_evidence import Evidence
from app.schemas.evidence import EvidenceRecord
from app.services.assessment import assess_evidence
from app.services.bands import BANDS_FILE, load_band_config
from app.services.recompute import recompute_many

router = APIRouter(prefix="/config", tags=["Config"])


# -------------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------------


class BandConfig(BaseModel):
    """RPN band thresholds on the points scale (20-100)."""

    low_max: int = Field(
        ge=20, le=100, description="Upper bound of Low band (points)"
    )
    medium_max: int = Field(
        ge=20, le=100, description="Upper bound of Medium band (points)"
    )

    @field_validator("medium_max")
    @classmethod
    def _validate_order(cls, v: int, info) -> int:
        low_max = info.data.get("low_max")
        if low_max is not None and not (20 <= low_max < v <= 100):
            raise ValueError(
                "Require 20 <= low_max < medium_max <= 100"
            )
        return v


class BandConfigResponse(BaseModel):
    low_max: int
    medium_max: int
    # Display helpers
    low_rpn_max: float
    medium_rpn_max: float
    high_rpn_min: float
    # Rule references for the UI
    rules: dict[str, str]


class RecomputePreviewRequest(BaseModel):
    low_max: int = Field(ge=20, le=100)
    medium_max: int = Field(ge=20, le=100)
    dry_run: bool = True


class RecomputePreviewResponse(BaseModel):
    total: int
    changed: int
    unchanged: int
    band_distribution: dict[str, dict[str, int]]
    changes: list[dict[str, Any]]


class RecomputeApplyRequest(BaseModel):
    low_max: int = Field(ge=20, le=100)
    medium_max: int = Field(ge=20, le=100)
    confirm: bool = Field(
        default=False, description="Must be true to actually persist changes"
    )


class RecomputeApplyResponse(BaseModel):
    success: bool
    message: str
    total: int
    changed: int
    unchanged: int
    band_distribution: dict[str, dict[str, int]]
    new_config_version: str | None = None


# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------


def _serialize_band_config(config: dict) -> BandConfigResponse:
    low_max = config["low_max"]
    medium_max = config["medium_max"]
    return BandConfigResponse(
        low_max=low_max,
        medium_max=medium_max,
        low_rpn_max=round(low_max / 20, 2),
        medium_rpn_max=round(medium_max / 20, 2),
        high_rpn_min=round((medium_max + 1) / 20, 2),
        rules={
            "low": f"Points ≤ {low_max} (RPN ≤ {round(low_max / 20, 2)}) → Unscripted",
            "medium": (
                f"Points {low_max + 1}–{medium_max} "
                f"(RPN {round((low_max + 1) / 20, 2)}–{round(medium_max / 20, 2)}) "
                f"→ Exploratory"
            ),
            "high": (
                f"Points ≥ {medium_max + 1} "
                f"(RPN ≥ {round((medium_max + 1) / 20, 2)}) → Scripted"
            ),
            "severity_floor": "Severity ≥ 4 → Scripted (overrides band)",
        },
    )


def _write_bands_yaml(low_max: int, medium_max: int) -> None:
    """Write the new band thresholds to bands.yaml."""
    content = (
        "# RAVEN Layer 3 — RPN band thresholds (points scale).\n"
        "# Editable at runtime by a team leader; run POST /config/recompute\n"
        "# (dry-run supported) to re-apply to all frozen evidence.\n"
        "# points = 12 x Severity + 5 x Probability + 3 x Detectability (20-100).\n"
        "# Display RPN is points / 20 (1.0-5.0).\n"
        f"low_max: {low_max}\n"
        f"medium_max: {medium_max}\n"
        "# High band is anything above medium_max (up to 100 points).\n"
    )
    BANDS_FILE.write_text(content, encoding="utf-8")


def _load_all_current_assessments(db: DBSession) -> list[tuple[EvidenceRecord, dict]]:
    """Load all current (fresh) assessments with their frozen evidence."""
    # Get all current requirement versions with their evidence and assessments
    assessments = (
        db.query(RiskAssessment)
        .join(
            RequirementVersion,
            RiskAssessment.requirement_version_id == RequirementVersion.id,
        )
        .filter(RiskAssessment.is_current.is_(True))
        .filter(RiskAssessment.freshness != "superseded")
        .all()
    )

    from app.schemas.evidence import (
        EvidenceField,
        SeverityEvidence,
        ProbabilityEvidence,
        DetectabilityEvidence,
        ComplexityLevel,
        DetectionLevel,
    )

    items: list[tuple[EvidenceRecord, dict]] = []
    for assessment in assessments:
        # Load the evidence record
        evidence = db.get(Evidence, assessment.evidence_id)
        if evidence is None:
            continue

        # Build EvidenceRecord from stored evidence - map ORM fields to schema
        severity = SeverityEvidence(
            patient_safety=EvidenceField[bool](
                value=evidence.patient_safety_value,
                confidence=evidence.patient_safety_confidence,
                evidence=evidence.patient_safety_evidence,
            ),
            product_quality=EvidenceField[bool](
                value=evidence.product_quality_value,
                confidence=evidence.product_quality_confidence,
                evidence=evidence.product_quality_evidence,
            ),
            batch_release=EvidenceField[bool](
                value=evidence.batch_release_value,
                confidence=evidence.batch_release_confidence,
                evidence=evidence.batch_release_evidence,
            ),
            data_integrity=EvidenceField[bool](
                value=evidence.data_integrity_value,
                confidence=evidence.data_integrity_confidence,
                evidence=evidence.data_integrity_evidence,
            ),
            regulatory_compliance=EvidenceField[bool](
                value=evidence.regulatory_compliance_value,
                confidence=evidence.regulatory_compliance_confidence,
                evidence=evidence.regulatory_compliance_evidence,
            ),
            business_continuity=EvidenceField[bool](
                value=evidence.business_continuity_value,
                confidence=evidence.business_continuity_confidence,
                evidence=evidence.business_continuity_evidence,
            ),
        )

        probability = ProbabilityEvidence(
            functional_complexity=EvidenceField[ComplexityLevel](
                value=evidence.functional_complexity_value,
                confidence=evidence.functional_complexity_confidence,
                evidence=evidence.functional_complexity_evidence,
            ),
            dependency_complexity=EvidenceField[ComplexityLevel](
                value=evidence.dependency_complexity_value,
                confidence=evidence.dependency_complexity_confidence,
                evidence=evidence.dependency_complexity_evidence,
            ),
            workflow_complexity=EvidenceField[ComplexityLevel](
                value=evidence.workflow_complexity_value,
                confidence=evidence.workflow_complexity_confidence,
                evidence=evidence.workflow_complexity_evidence,
            ),
        )

        detectability = DetectabilityEvidence(
            detection_controls=EvidenceField[DetectionLevel](
                value=evidence.detection_controls_value,
                confidence=evidence.detection_controls_confidence,
                evidence=evidence.detection_controls_evidence,
            ),
            traceability=EvidenceField[DetectionLevel](
                value=evidence.traceability_value,
                confidence=evidence.traceability_confidence,
                evidence=evidence.traceability_evidence,
            ),
            failure_visibility=EvidenceField[DetectionLevel](
                value=evidence.failure_visibility_value,
                confidence=evidence.failure_visibility_confidence,
                evidence=evidence.failure_visibility_evidence,
            ),
        )

        record = EvidenceRecord(
            requirement_version_id=str(assessment.requirement_version_id),
            evidence_id=str(assessment.evidence_id),
            gamp_category=evidence.gamp_category_value,
            gamp_reason=evidence.gamp_reason,
            severity=severity,
            probability=probability,
            detectability=detectability,
        )

        # Build the stored frozen snapshot for comparison
        stored = {
            "gxp_impact": assessment.gxp_impact,
            "severity": {
                "score": assessment.severity_result.score
                if assessment.severity_result
                else None,
                "rule_id": assessment.severity_result.rule_id
                if assessment.severity_result
                else None,
            },
            "probability": {
                "score": assessment.probability_result.score
                if assessment.probability_result
                else None,
                "rule_id": assessment.probability_result.rule_id
                if assessment.probability_result
                else None,
            },
            "detectability": {
                "score": assessment.detectability_result.score
                if assessment.detectability_result
                else None,
                "rule_id": assessment.detectability_result.rule_id
                if assessment.detectability_result
                else None,
            },
            "rpn": assessment.rpn,
            "band": assessment.band.value
            if hasattr(assessment.band, "value")
            else assessment.band,
        }
        items.append((record, stored))

    return items


# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------


@router.get("/bands", response_model=BandConfigResponse)
def get_bands() -> BandConfigResponse:
    """Return the current band thresholds from bands.yaml."""
    config = load_band_config()
    return _serialize_band_config(config)


@router.post("/bands", response_model=BandConfigResponse)
def update_bands(payload: BandConfig) -> BandConfigResponse:
    """Update band thresholds in bands.yaml (does NOT recompute)."""
    _write_bands_yaml(payload.low_max, payload.medium_max)
    config = load_band_config()
    return _serialize_band_config(config)


@router.post("/recompute/preview", response_model=RecomputePreviewResponse)
def recompute_preview(
    payload: RecomputePreviewRequest,
    db: DBSession,
) -> RecomputePreviewResponse:
    """Dry-run recompute with new band thresholds — shows what would change."""
    items = _load_all_current_assessments(db)
    if not items:
        return RecomputePreviewResponse(
            total=0,
            changed=0,
            unchanged=0,
            band_distribution={"before": {}, "after": {}},
            changes=[],
        )

    result = recompute_many(
        items,
        low_max=payload.low_max,
        medium_max=payload.medium_max,
        dry_run=True,
    )

    # Convert band_distribution to match response model
    band_dist = result["band_distribution"]
    dist_response: dict[str, dict[str, int]] = {
        "before": band_dist.get("before", {}),
        "after": band_dist.get("after", {}),
    }

    return RecomputePreviewResponse(
        total=result["total"],
        changed=result["changed"],
        unchanged=result["unchanged"],
        band_distribution=dist_response,
        changes=result["changes"],
    )


@router.post("/recompute/apply", response_model=RecomputeApplyResponse)
def recompute_apply(
    payload: RecomputeApplyRequest,
    db: DBSession,
) -> RecomputeApplyResponse:
    """Apply new band thresholds and recompute all current assessments."""
    if not payload.confirm:
        raise HTTPException(
            status_code=400,
            detail="Must set confirm=true to persist recompute changes",
        )

    items = _load_all_current_assessments(db)
    if not items:
        return RecomputeApplyResponse(
            success=True,
            message="No current assessments to recompute.",
            total=0,
            changed=0,
            unchanged=0,
            band_distribution={"before": {}, "after": {}},
        )

    # First, write the new config
    _write_bands_yaml(payload.low_max, payload.medium_max)

    # Then recompute and persist
    from app.services.persistence import ensure_configuration_version
    from app.models.configuration_version import ConfigurationVersion
    from app.services.assurance import decide_assurance
    from app.models.assurance_decision import AssuranceDecision
    from app.models.enums import AssuranceLevel
    from datetime import datetime, timezone
    from uuid import uuid4

    # Create a new configuration version
    import hashlib
    import json

    config_payload = {
        "low_max": payload.low_max,
        "medium_max": payload.medium_max,
    }
    config_hash = hashlib.sha256(
        json.dumps(config_payload, sort_keys=True).encode()
    ).hexdigest()
    new_version = f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    cfg = ConfigurationVersion(
        version=new_version,
        config_hash=config_hash,
        description=f"Band thresholds: low_max={payload.low_max}, medium_max={payload.medium_max}",
    )
    db.add(cfg)
    db.flush()

    changed_count = 0
    before_bands: dict[str, int] = {}
    after_bands: dict[str, int] = {}

    for record, stored in items:
        fresh = assess_evidence(
            record, low_max=payload.low_max, medium_max=payload.medium_max
        )

        old_band = stored.get("band")
        new_band = fresh["band"]
        before_bands[old_band] = before_bands.get(old_band, 0) + 1
        after_bands[new_band] = after_bands.get(new_band, 0) + 1

        if new_band != old_band:
            changed_count += 1

        # Create new risk assessment
        from app.models.engine_results import (
            SeverityResult,
            ProbabilityResult,
            DetectabilityResult,
        )

        sev_res = SeverityResult(
            score=fresh["severity"]["score"],
            rule_id=fresh["severity"]["rule_id"],
            rule_version=fresh["severity"]["rule_version"],
            decision_path=fresh["severity"]["decision_path"],
            reasoning=fresh["severity"]["reasoning"],
        )
        prob_res = ProbabilityResult(
            score=fresh["probability"]["score"],
            rule_id=fresh["probability"]["rule_id"],
            rule_version=fresh["probability"]["rule_version"],
            decision_path=fresh["probability"]["decision_path"],
            reasoning=fresh["probability"]["reasoning"],
        )
        det_res = DetectabilityResult(
            score=fresh["detectability"]["score"],
            rule_id=fresh["detectability"]["rule_id"],
            rule_version=fresh["detectability"]["rule_version"],
            decision_path=fresh["detectability"]["decision_path"],
            reasoning=fresh["detectability"]["reasoning"],
        )
        db.add_all([sev_res, prob_res, det_res])
        db.flush()

        # Supersede old assessment
        old_assessment = (
            db.query(RiskAssessment)
            .filter(
                RiskAssessment.requirement_version_id == record.requirement_version_id,
                RiskAssessment.is_current.is_(True),
            )
            .first()
        )
        if old_assessment:
            old_assessment.is_current = False
            old_assessment.freshness = "superseded"
            old_assessment.status = "SUPERSEDED"

        # Create new assessment
        new_assessment = RiskAssessment(
            requirement_version_id=record.requirement_version_id,
            evidence_id=record.evidence_id,
            severity_result_id=sev_res.id,
            probability_result_id=prob_res.id,
            detectability_result_id=det_res.id,
            rule_config_version_id=cfg.id,
            gxp_impact=fresh["gxp_impact"],
            gxp_reason=fresh["gxp_reason"],
            gamp_category=fresh["gamp_category"],
            gamp_reason=fresh["gamp_reason"],
            rpn=fresh["rpn"],
            rpn_points=fresh["rpn_points"],
            band=new_band,
            status="FINAL",
            is_current=True,
            freshness="fresh",
        )
        db.add(new_assessment)
        db.flush()

        # Create assurance decision
        assurance = decide_assurance(fresh["severity"]["score"], new_band)
        assurance_decision = AssuranceDecision(
            risk_assessment_id=new_assessment.id,
            assurance_level=AssuranceLevel(assurance["assurance_level"].upper()),
            rule_id=assurance["rule_id"],
            rule_version=new_version,
            generate_test=assurance["generate_test"],
            reasoning=assurance["reason"],
            decision_path={
                "severity": fresh["severity"]["score"],
                "band": new_band,
                "level": assurance["assurance_level"],
            },
            freshness="fresh",
        )
        db.add(assurance_decision)

    db.commit()

    return RecomputeApplyResponse(
        success=True,
        message=f"Recompute complete. {changed_count} of {len(items)} assessments changed band.",
        total=len(items),
        changed=changed_count,
        unchanged=len(items) - changed_count,
        band_distribution={"before": before_bands, "after": after_bands},
        new_config_version=new_version,
    )