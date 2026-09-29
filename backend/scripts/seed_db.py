"""
Seed the RAVEN database with a coherent demonstration dataset.

Covers every table so each future agent/engine has queryable inputs:

- Requirements (HIGH / MEDIUM / LOW risk examples)
- RequirementVersion (including a superseded version)
- Evidence (full Agent 1 triples)
- ConfigurationVersion (current + superseded rule snapshots)
- RiskAssessment + Severity / Probability / Detectability results
  (including one superseded assessment computed with old rules)
- AssuranceDecision, TestScript, ComplianceResult, PromptVersion

IDs are deterministic (UUID5) so re-seeding produces identical rows.

Usage:
    python scripts/seed_db.py            # seed an empty database
    python scripts/seed_db.py --reset    # drop ORM tables, recreate, seed
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import uuid
from pathlib import Path

# Allow `python scripts/seed_db.py` from the backend root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import (
    AssuranceDecision,
    AssuranceLevel,
    ComplexityLevel,
    ComplianceResult,
    ComplianceStatus,
    ConfigurationVersion,
    DetectabilityResult,
    DetectionLevel,
    Evidence,
    ProbabilityResult,
    PromptVersion,
    Requirement,
    RequirementStatus,
    RequirementVersion,
    RiskAssessment,
    RiskBand,
    SeverityResult,
    TestScript,
    TestScriptStatus,
)

SEED_NS = uuid.NAMESPACE_URL


def sid(key: str) -> uuid.UUID:
    """Deterministic UUID for a seed entity key."""

    return uuid.uuid5(SEED_NS, f"raven/seed/{key}")


def sha(text: str) -> str:
    """SHA-256 hex digest used for content hashes."""

    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ==========================================================
# Builders
# ==========================================================


def build_evidence(
    key: str,
    version_id: uuid.UUID,
    severity: dict[str, tuple[str, float, str]],
    complexity: ComplexityLevel,
    detection: DetectionLevel,
    gxp: tuple[bool, float, str, str],
    gamp: tuple[str, float, str, str],
) -> Evidence:
    """Build an Evidence row with uniform confidence per group."""

    kwargs: dict = {"id": sid(key), "requirement_version_id": version_id}
    for field, (val, conf, ev) in severity.items():
        kwargs[f"{field}_value"] = val
        kwargs[f"{field}_confidence"] = conf
        kwargs[f"{field}_evidence"] = ev
    for field in (
        "functional_complexity",
        "dependency_complexity",
        "workflow_complexity",
    ):
        kwargs[f"{field}_value"] = complexity
        kwargs[f"{field}_confidence"] = 0.82
        kwargs[f"{field}_evidence"] = (
            f"Complexity input {field.replace('_', ' ')} assessed "
            f"as {complexity.value}."
        )
    for field in ("detection_controls", "traceability", "failure_visibility"):
        kwargs[f"{field}_value"] = detection
        kwargs[f"{field}_confidence"] = 0.78
        kwargs[f"{field}_evidence"] = (
            f"Detectability input {field.replace('_', ' ')} assessed "
            f"as {detection.value}."
        )
    gxp_val, gxp_conf, gxp_ev, gxp_reason = gxp
    gamp_val, gamp_conf, gamp_ev, gamp_reason = gamp
    kwargs.update(
        gxp_impact_value=gxp_val,
        gxp_impact_confidence=gxp_conf,
        gxp_impact_evidence=gxp_ev,
        gxp_reason=gxp_reason,
        gamp_category_value=gamp_val,
        gamp_category_confidence=gamp_conf,
        gamp_category_evidence=gamp_ev,
        gamp_reason=gamp_reason,
    )
    return Evidence(**kwargs)


def build_sub_results(
    key: str,
    assessment_id: uuid.UUID,
    rule_version: str,
    severity: tuple[int, str],
    probability: tuple[int, float, float, str],
    detectability: tuple[int, int, str],
) -> tuple[SeverityResult, ProbabilityResult, DetectabilityResult]:
    """Build the three deterministic sub-results for an assessment."""

    sev_score, sev_reason = severity
    prob_score, weighted, modifier, prob_reason = probability
    det_score, floor, det_reason = detectability
    return (
        SeverityResult(
            id=sid(f"{key}/severity"),
            risk_assessment_id=assessment_id,
            score=sev_score,
            rule_id="SEV-IMPACT-01",
            rule_version=rule_version,
            decision_path={
                "rule": "SEV-IMPACT-01",
                "inputs": ["patient_safety", "data_integrity"],
                "outcome": sev_score,
            },
            reasoning=sev_reason,
        ),
        ProbabilityResult(
            id=sid(f"{key}/probability"),
            risk_assessment_id=assessment_id,
            score=prob_score,
            rule_id="PROB-COMPLEX-02",
            rule_version=rule_version,
            decision_path={
                "rule": "PROB-COMPLEX-02",
                "weighted_sum": weighted,
                "gamp_modifier": modifier,
                "outcome": prob_score,
            },
            weighted_sum=weighted,
            gamp_modifier=modifier,
            reasoning=prob_reason,
        ),
        DetectabilityResult(
            id=sid(f"{key}/detectability"),
            risk_assessment_id=assessment_id,
            score=det_score,
            rule_id="DET-CONTROLS-01",
            rule_version=rule_version,
            decision_path={
                "rule": "DET-CONTROLS-01",
                "controls_floor": floor,
                "outcome": det_score,
            },
            controls_floor=floor,
            reasoning=det_reason,
        ),
    )


# ==========================================================
# Seed
# ==========================================================


def seed(session: Session) -> None:
    """Insert the full demonstration dataset."""

    # --- Rule snapshots -------------------------------------------
    cfg_old = ConfigurationVersion(
        id=sid("config/3.1.0"),
        version="3.1.0",
        description="Superseded baseline rule snapshot.",
        config_hash=sha("raven-rules-3.1.0"),
    )
    cfg_new = ConfigurationVersion(
        id=sid("config/3.2.0"),
        version="3.2.0",
        description="Current baseline: severity tree v7, probability weights v4.",
        config_hash=sha("raven-rules-3.2.0"),
    )
    session.add_all([cfg_old, cfg_new])

    # --- Prompt snapshots ------------------------------------------
    prompts = [
        ("agent_1", 1, "Extract GxP evidence triples for: {requirement_text}"),
        ("agent_1", 2, "Extract GxP evidence triples with confidence for: {text}"),
        (
            "test_script_generator",
            1,
            "Generate a validation script at {level} rigour for: {requirement_text}",
        ),
        (
            "compliance_analyzer",
            1,
            "Assess clause {clause} of {framework} against: {requirement_text}",
        ),
    ]
    prompt_ids: dict[tuple[str, int], uuid.UUID] = {}
    for agent, ver, text in prompts:
        pv = PromptVersion(
            id=sid(f"prompt/{agent}/{ver}"),
            agent_name=agent,
            version=ver,
            prompt=text,
            hash=sha(f"{agent}:{ver}:{text}"),
        )
        session.add(pv)
        prompt_ids[(agent, ver)] = pv.id

    # --- R1: HIGH risk, GxP, Category 5 ------------------------------
    r1 = Requirement(
        id=sid("req/audit-trail"),
        title="Audit trail records shall be immutable",
        description="All audit trail entries must be tamper-evident and immutable.",
        status=RequirementStatus.APPROVED,
        created_by="seed",
    )
    session.add(r1)
    r1v1_text = "Audit trail entries must not be editable."
    r1v2_text = (
        "Audit trail entries must be tamper-evident, immutable, and "
        "retained for the record retention period."
    )
    r1v1 = RequirementVersion(
        id=sid("req/audit-trail/v1"),
        requirement_id=r1.id,
        version_number=1,
        text=r1v1_text,
        hash_sha256=sha(r1v1_text),
        is_current=False,
    )
    r1v2 = RequirementVersion(
        id=sid("req/audit-trail/v2"),
        requirement_id=r1.id,
        version_number=2,
        text=r1v2_text,
        hash_sha256=sha(r1v2_text),
        is_current=True,
    )
    session.add_all([r1v1, r1v2])

    r1_sev = {
        "patient_safety": ("CRITICAL", 0.95, "Loss of audit trail hides harm."),
        "product_quality": ("HIGH", 0.93, "Batch decisions become unverifiable."),
        "batch_release": ("HIGH", 0.91, "Release relies on audit review."),
        "data_integrity": ("CRITICAL", 0.97, "ALCOA+ directly impacted."),
        "regulatory_compliance": ("HIGH", 0.94, "Part 11 11.10(e) applies."),
        "business_continuity": (
            "MEDIUM",
            0.72,
            " Investigations stall without records.",
        ),
    }
    r1_ev = build_evidence(
        "evidence/r1v2",
        r1v2.id,
        r1_sev,
        ComplexityLevel.HIGH,
        DetectionLevel.LOW,
        (
            True,
            0.98,
            "Requirement governs data integrity controls.",
            "Tampering hides product quality failures.",
        ),
        (
            "Category 5",
            0.9,
            "Custom audit enforcement logic.",
            "Bespoke software, GAMP 5 Category 5.",
        ),
    )
    session.add(r1_ev)

    # Superseded assessment of R1 v2 computed with the old rule snapshot.
    r1_old = RiskAssessment(
        id=sid("risk/r1v2/old"),
        requirement_version_id=r1v2.id,
        evidence_id=r1_ev.id,
        rule_config_version_id=cfg_old.id,
        gxp_impact=True,
        gxp_reason="Confirmed: protects ePHI audit integrity.",
        gamp_category="Category 5",
        gamp_reason="Confirmed bespoke enforcement.",
        rpn=64,
        band=RiskBand.HIGH,
        status="SUPERSEDED",
        is_current=False,
    )
    session.add(r1_old)
    old_subs = build_sub_results(
        "risk/r1v2/old",
        r1_old.id,
        "3.1.0",
        (4, "High impact on data integrity."),
        (4, 9.0, 1.0, "Custom logic is error prone."),
        (4, 3, "Tampering is hard to detect."),
    )
    session.add_all(old_subs)
    r1_old.severity_result_id = old_subs[0].id
    r1_old.probability_result_id = old_subs[1].id
    r1_old.detectability_result_id = old_subs[2].id

    # Current assessment of R1 v2 (RPN 5x4x4 = 80, HIGH -> SCRIPTED).
    r1_new = RiskAssessment(
        id=sid("risk/r1v2/current"),
        requirement_version_id=r1v2.id,
        evidence_id=r1_ev.id,
        rule_config_version_id=cfg_new.id,
        gxp_impact=True,
        gxp_reason="Confirmed: protects ePHI audit integrity.",
        gamp_category="Category 5",
        gamp_reason="Confirmed bespoke enforcement.",
        rpn=80,
        band=RiskBand.HIGH,
        status="FINAL",
        is_current=True,
    )
    session.add(r1_new)
    new_subs = build_sub_results(
        "risk/r1v2/current",
        r1_new.id,
        "3.2.0",
        (5, "Loss of audit trail is critical to patient safety."),
        (4, 10.5, 1.0, "Bespoke Category 5 logic is highly complex."),
        (4, 3, "Silent tampering evades routine review."),
    )
    session.add_all(new_subs)
    r1_new.severity_result_id = new_subs[0].id
    r1_new.probability_result_id = new_subs[1].id
    r1_new.detectability_result_id = new_subs[2].id

    r1_ad = AssuranceDecision(
        id=sid("assurance/r1"),
        risk_assessment_id=r1_new.id,
        assurance_level=AssuranceLevel.SCRIPTED,
        rule_id="ASS-BAND-01",
        rule_version="3.2.0",
        reasoning="HIGH band requires scripted testing.",
        decision_path={"band": "HIGH", "level": "SCRIPTED"},
    )
    session.add(r1_ad)

    r1_ts1 = TestScript(
        id=sid("script/r1/v1"),
        requirement_version_id=r1v2.id,
        assurance_decision_id=r1_ad.id,
        prompt_version_id=prompt_ids[("test_script_generator", 1)],
        script="1. Attempt to edit an audit entry.\n2. Verify the edit is rejected.",
        status=TestScriptStatus.SUPERSEDED,
        version=1,
    )
    r1_ts2 = TestScript(
        id=sid("script/r1/v2"),
        requirement_version_id=r1v2.id,
        assurance_decision_id=r1_ad.id,
        prompt_version_id=prompt_ids[("test_script_generator", 1)],
        script=(
            "1. Attempt to edit an audit entry as admin.\n"
            "2. Verify rejection and alert.\n"
            "3. Verify retention period enforcement."
        ),
        status=TestScriptStatus.APPROVED,
        version=2,
    )
    session.add_all([r1_ts1, r1_ts2])

    for fw, clause, status, coverage, reason in [
        (
            "FDA 21 CFR Part 11",
            "11.10(a)",
            ComplianceStatus.COMPLIANT,
            1.0,
            "System validation covers closed-system controls.",
        ),
        (
            "FDA 21 CFR Part 11",
            "11.10(d)",
            ComplianceStatus.COMPLIANT,
            0.9,
            "Access limited to authorized individuals.",
        ),
        (
            "EU GMP Annex 11",
            "Clause 7.1",
            ComplianceStatus.PARTIALLY_COMPLIANT,
            0.6,
            "Retention wording needs explicit time period.",
        ),
    ]:
        session.add(
            ComplianceResult(
                id=sid(f"compliance/r1/{clause}"),
                requirement_version_id=r1v2.id,
                prompt_version_id=prompt_ids[("compliance_analyzer", 1)],
                framework=fw,
                clause=clause,
                status=status,
                coverage=coverage,
                reasoning=reason,
            )
        )
    r1.current_version_id = r1v2.id

    # --- R2: MEDIUM risk, GxP, Category 4 ------------------------------
    r2 = Requirement(
        id=sid("req/session-lock"),
        title="Inactive sessions shall lock after 15 minutes",
        description="Sessions inactive for 15 minutes must lock automatically.",
        status=RequirementStatus.APPROVED,
        created_by="seed",
    )
    session.add(r2)
    r2v1_text = "Sessions inactive for 15 minutes must lock automatically."
    r2v1 = RequirementVersion(
        id=sid("req/session-lock/v1"),
        requirement_id=r2.id,
        version_number=1,
        text=r2v1_text,
        hash_sha256=sha(r2v1_text),
        is_current=True,
    )
    session.add(r2v1)

    r2_sev = {
        "patient_safety": ("MEDIUM", 0.8, "Unattended sessions expose records."),
        "product_quality": ("LOW", 0.7, "No direct product impact."),
        "batch_release": ("LOW", 0.65, "Release unaffected."),
        "data_integrity": ("MEDIUM", 0.83, "Session hijack risks data."),
        "regulatory_compliance": ("MEDIUM", 0.81, "Part 11 11.10(d) applies."),
        "business_continuity": ("LOW", 0.6, "Lockout is recoverable."),
    }
    r2_ev = build_evidence(
        "evidence/r2v1",
        r2v1.id,
        r2_sev,
        ComplexityLevel.MEDIUM,
        DetectionLevel.MEDIUM,
        (
            True,
            0.9,
            "Session control protects ePHI access.",
            "Unattended access risks patient data.",
        ),
        (
            "Category 4",
            0.85,
            "Configurable timeout parameter.",
            "Configured product, GAMP 5 Category 4.",
        ),
    )
    session.add(r2_ev)

    # RPN 4x3x3 = 36, MEDIUM -> EXPLORATORY.
    r2_ra = RiskAssessment(
        id=sid("risk/r2v1/current"),
        requirement_version_id=r2v1.id,
        evidence_id=r2_ev.id,
        rule_config_version_id=cfg_new.id,
        gxp_impact=True,
        gxp_reason="Confirmed: session access control.",
        gamp_category="Category 4",
        gamp_reason="Confirmed configurable timeout.",
        rpn=36,
        band=RiskBand.MEDIUM,
        status="FINAL",
        is_current=True,
    )
    session.add(r2_ra)
    r2_subs = build_sub_results(
        "risk/r2v1/current",
        r2_ra.id,
        "3.2.0",
        (4, "Unauthorized access is a significant hazard."),
        (3, 7.5, 0.5, "Moderate configuration complexity."),
        (3, 2, "Idle sessions are visible on screen."),
    )
    session.add_all(r2_subs)
    r2_ra.severity_result_id = r2_subs[0].id
    r2_ra.probability_result_id = r2_subs[1].id
    r2_ra.detectability_result_id = r2_subs[2].id

    r2_ad = AssuranceDecision(
        id=sid("assurance/r2"),
        risk_assessment_id=r2_ra.id,
        assurance_level=AssuranceLevel.EXPLORATORY,
        rule_id="ASS-BAND-01",
        rule_version="3.2.0",
        reasoning="MEDIUM band warrants exploratory testing.",
        decision_path={"band": "MEDIUM", "level": "EXPLORATORY"},
    )
    session.add(r2_ad)
    session.add(
        TestScript(
            id=sid("script/r2/v1"),
            requirement_version_id=r2v1.id,
            assurance_decision_id=r2_ad.id,
            prompt_version_id=prompt_ids[("test_script_generator", 1)],
            script="1. Leave session idle 15 minutes.\n2. Verify lock screen appears.",
            status=TestScriptStatus.DRAFT,
            version=1,
        )
    )
    session.add(
        ComplianceResult(
            id=sid("compliance/r2/11.10(d)"),
            requirement_version_id=r2v1.id,
            prompt_version_id=prompt_ids[("compliance_analyzer", 1)],
            framework="FDA 21 CFR Part 11",
            clause="11.10(d)",
            status=ComplianceStatus.COMPLIANT,
            coverage=0.8,
            reasoning="Automatic lockout limits system access.",
        )
    )
    r2.current_version_id = r2v1.id

    # --- R3: LOW risk, non-GxP ------------------------------------------
    r3 = Requirement(
        id=sid("req/tooltip"),
        title="Login page shall show help tooltips",
        description="Contextual help tooltips appear on the login page.",
        status=RequirementStatus.DRAFT,
        created_by="seed",
    )
    session.add(r3)
    r3v1_text = "Contextual help tooltips appear on the login page."
    r3v1 = RequirementVersion(
        id=sid("req/tooltip/v1"),
        requirement_id=r3.id,
        version_number=1,
        text=r3v1_text,
        hash_sha256=sha(r3v1_text),
        is_current=True,
    )
    session.add(r3v1)

    r3_sev = {
        field: ("LOW", 0.7, f"No safety or quality impact from {field}.")
        for field in (
            "patient_safety",
            "product_quality",
            "batch_release",
            "data_integrity",
            "regulatory_compliance",
            "business_continuity",
        )
    }
    r3_ev = build_evidence(
        "evidence/r3v1",
        r3v1.id,
        r3_sev,
        ComplexityLevel.LOW,
        DetectionLevel.HIGH,
        (
            False,
            0.92,
            "Cosmetic help text only.",
            "No impact on safety, quality, or integrity.",
        ),
        (
            "Category 1",
            0.88,
            "Standard UI infrastructure.",
            "Infrastructure software, GAMP 5 Category 1.",
        ),
    )
    session.add(r3_ev)

    # RPN 2x2x2 = 8, LOW -> UNSCRIPTED (no test script generated).
    r3_ra = RiskAssessment(
        id=sid("risk/r3v1/current"),
        requirement_version_id=r3v1.id,
        evidence_id=r3_ev.id,
        rule_config_version_id=cfg_new.id,
        gxp_impact=False,
        gxp_reason="Confirmed cosmetic-only change.",
        gamp_category="Category 1",
        gamp_reason="Confirmed infrastructure software.",
        rpn=8,
        band=RiskBand.LOW,
        status="FINAL",
        is_current=True,
    )
    session.add(r3_ra)
    r3_subs = build_sub_results(
        "risk/r3v1/current",
        r3_ra.id,
        "3.2.0",
        (2, "Cosmetic defect at worst."),
        (2, 4.5, 0.0, "Trivial static text."),
        (2, 1, "Immediately visible in the UI."),
    )
    session.add_all(r3_subs)
    r3_ra.severity_result_id = r3_subs[0].id
    r3_ra.probability_result_id = r3_subs[1].id
    r3_ra.detectability_result_id = r3_subs[2].id

    session.add(
        AssuranceDecision(
            id=sid("assurance/r3"),
            risk_assessment_id=r3_ra.id,
            assurance_level=AssuranceLevel.UNSCRIPTED,
            rule_id="ASS-BAND-01",
            rule_version="3.2.0",
            reasoning="LOW band needs no scripted testing.",
            decision_path={"band": "LOW", "level": "UNSCRIPTED"},
        )
    )
    r3.current_version_id = r3v1.id


def main() -> int:
    """Entry point: optionally reset, then seed an empty database."""

    parser = argparse.ArgumentParser(description="Seed the RAVEN database.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop all ORM tables and recreate before seeding.",
    )
    args = parser.parse_args()

    if args.reset:
        print("Dropping all ORM tables...")
        Base.metadata.drop_all(bind=engine)
    else:
        with Session(engine) as session:
            existing = session.query(Requirement).count()
        if existing:
            print(
                f"Database already contains {existing} requirement(s). "
                "Re-run with --reset to reseed."
            )
            return 0

    print("Creating schema...")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        seed(session)
        session.commit()

    with Session(engine) as session:
        counts = {
            name: session.scalar(select(func.count()).select_from(table))
            for name, table in Base.metadata.tables.items()
        }
    print(f"Seeded {settings.DATABASE_URL}:")
    for name in sorted(counts):
        print(f"  {name}: {counts[name]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
