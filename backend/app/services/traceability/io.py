"""Build a :class:`TraceSnapshot` from the database.

Adaptation notes (spec section 1 vs RAVEN schema):

- requirement node <-> ``Requirement`` + its current ``RequirementVersion``.
  ``status`` maps to ``deleted`` for ``RETIRED``/``SUPERSEDED``, else
  ``active``. ``req_key`` falls back to ``REQ-<short-uuid>``.
- risk node <-> ``RiskAssessment``; ``requirement_id`` resolves through
  ``requirement_version.requirement_id``.
- assurance node <-> ``AssuranceDecision``; ``risk_id`` resolves through
  ``risk_assessment_id``.
- test node <-> ``TestScript``; ``risk_id`` resolves through
  ``assurance_decision -> risk_assessment`` for generated tests.
"""

from __future__ import annotations

from app.models.assurance_decision import AssuranceDecision
from app.models.change_event import ChangeEvent
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.trace_link import TraceLink
from app.services.traceability.snapshot import (
    AssessmentInfo,
    DecisionInfo,
    LinkInfo,
    RequirementInfo,
    RiskInfo,
    TestInfo,
    TraceSnapshot,
)

_DELETED_STATUSES = {"RETIRED", "SUPERSEDED"}

_ASSURANCE_LABELS = {
    "scripted": "Scripted testing",
    "exploratory": "Exploratory testing",
    "unscripted": "Unscripted testing",
}


def _req_status(status: object) -> str:
    name = getattr(status, "value", status)
    return "deleted" if str(name) in _DELETED_STATUSES else "active"


def snapshot_from_db(session) -> TraceSnapshot:
    requirements: dict[str, RequirementInfo] = {}
    for req in session.query(Requirement).all():
        current = None
        if req.current_version_id is not None:
            current = session.get(RequirementVersion, req.current_version_id)
        version_number = current.version_number if current is not None else 1
        key = req.req_key or f"REQ-{str(req.id)[:8]}"
        requirements[str(req.id)] = RequirementInfo(
            id=str(req.id),
            req_key=key,
            version=version_number,
            status=_req_status(req.status),
        )

    versions = {str(v.id): v for v in session.query(RequirementVersion).all()}

    risks: dict[str, RiskInfo] = {}
    for assessment in session.query(RiskAssessment).all():
        version = versions.get(str(assessment.requirement_version_id))
        if version is None:
            continue
        severity = probability = detectability = None
        if assessment.severity_result is not None:
            severity = assessment.severity_result.score
        if assessment.probability_result is not None:
            probability = assessment.probability_result.score
        if assessment.detectability_result is not None:
            detectability = assessment.detectability_result.score
        band = getattr(assessment.band, "value", assessment.band)
        band = str(band).capitalize() if band else None
        risks[str(assessment.id)] = RiskInfo(
            id=str(assessment.id),
            requirement_id=str(version.requirement_id),
            requirement_version_id=str(assessment.requirement_version_id),
            freshness=getattr(assessment, "freshness", "fresh") or "fresh",
            is_current_version=bool(version.is_current),
            severity=severity,
            probability=probability,
            detectability=detectability,
            rpn=assessment.rpn,
            band=band,
        )

    assessments: dict[str, AssessmentInfo] = {}
    risk_ids = set(risks)
    for assessment in session.query(RiskAssessment).all():
        if str(assessment.id) not in risk_ids:
            continue
        assessments[str(assessment.id)] = AssessmentInfo(
            id=str(assessment.id),
            risk_id=str(assessment.id),  # risk node IS the assessment row
            freshness=getattr(assessment, "freshness", "fresh") or "fresh",
        )

    decisions: dict[str, DecisionInfo] = {}
    decision_risk: dict[str, str] = {}
    for decision in session.query(AssuranceDecision).all():
        risk_id = str(decision.risk_assessment_id)
        decision_risk[str(decision.id)] = risk_id
        level = getattr(decision.assurance_level, "value", decision.assurance_level)
        level = str(level).lower()
        decisions[str(decision.id)] = DecisionInfo(
            id=str(decision.id),
            assessment_id=risk_id,
            risk_id=risk_id,
            freshness=getattr(decision, "freshness", "fresh") or "fresh",
            level=level,
            reason_code=decision.rule_id or "",
            label=_ASSURANCE_LABELS.get(level, level),
            method=(decision.decision_path or {}).get("method", "")
            if isinstance(decision.decision_path, dict)
            else "",
        )

    tests: dict[str, TestInfo] = {}
    for script in session.query(TestScript).all():
        risk_id = None
        if script.assurance_decision_id is not None:
            risk_id = decision_risk.get(str(script.assurance_decision_id))
        tests[str(script.id)] = TestInfo(
            id=str(script.id),
            origin=getattr(script, "origin", "generated") or "generated",
            freshness=getattr(script, "freshness", "fresh") or "fresh",
            title=getattr(script, "title", None) or "",
            external_code=getattr(script, "external_code", None),
            requirement_version_id=str(script.requirement_version_id),
            decision_id=str(script.assurance_decision_id)
            if script.assurance_decision_id is not None
            else None,
            risk_id=risk_id,
        )

    links = [
        LinkInfo(
            id=str(row.id),
            src_type=row.src_type,
            src_id=row.src_id,
            dst_type=row.dst_type,
            dst_id=row.dst_id,
            link_type=row.link_type,
            origin=row.origin,
            active=bool(row.active),
            suppressed=bool(row.suppressed),
            stale=bool(row.stale),
        )
        for row in session.query(TraceLink).all()
    ]

    open_changes = {
        str(e.requirement_id)
        for e in session.query(ChangeEvent)
        .filter(ChangeEvent.status.in_(["open", "reanalyzed"]))
        .all()
    }

    return TraceSnapshot(
        requirements=requirements,
        risks=risks,
        assessments=assessments,
        decisions=decisions,
        tests=tests,
        links=links,
        open_change_requirement_ids=open_changes,
    )
