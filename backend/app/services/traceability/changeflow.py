"""Change-impact state machine (spec section 6).

``open -> reanalyzed -> confirmed | accepted`` plus ``open -> accepted``
(skip re-analysis) and automatic ``superseded`` when a requirement is
edited again before its event resolves. Terminal states (confirmed,
accepted, superseded) cannot transition further; invalid transitions
raise :class:`InvalidStateError` (mapped to 409 by the API).
"""

from __future__ import annotations

from datetime import UTC, datetime

TERMINAL_STATES = ("confirmed", "accepted", "superseded")

_ALLOWED = {
    "open": ("reanalyzed", "accepted"),
    "reanalyzed": ("confirmed", "accepted"),
    "confirmed": (),
    "accepted": (),
    "superseded": (),
}


class InvalidStateError(ValueError):
    """Raised when a transition is not allowed from the current state."""


def check_transition(current: str, target: str) -> None:
    """Raise :class:`InvalidStateError` unless ``current -> target`` is legal."""
    if target not in _ALLOWED.get(current, ()):
        raise InvalidStateError(f"invalid_state: cannot move {current!r} -> {target!r}")


def empty_impact() -> dict:
    return {"risks": [], "assessments": [], "decisions": [], "tests": [], "links": []}


def union_impacts(first: dict, second: dict) -> dict:
    """Union two impact dicts (string-id lists, sorted)."""
    out = {}
    for key in ("risks", "assessments", "decisions", "tests", "links"):
        out[key] = sorted(set(first.get(key, [])) | set(second.get(key, [])))
    return out


def _now() -> datetime:
    return datetime.now(UTC)


def record_change(
    session,
    requirement_id,
    kind: str,
    impact: dict,
    created_by: str,
    baseline_assessment_id: str | None = None,
) -> object:
    """Create a change event, superseding prior open/reanalyzed ones.

    The new event's impact is the union of its own impact with all prior
    open events' impacts (spec section 6.2, ``superseded`` transition).
    """
    from app.models.change_event import ChangeEvent

    requirement_id = coerce_uuid(requirement_id)
    priors = (
        session.query(ChangeEvent)
        .filter(
            ChangeEvent.requirement_id == requirement_id,
            ChangeEvent.status.in_(["open", "reanalyzed"]),
        )
        .order_by(ChangeEvent.created_at.asc())
        .all()
    )
    merged = dict(impact)
    carried_from = None
    for prior in priors:
        merged = union_impacts(merged, prior.impact or empty_impact())
        prior.status = "superseded"
        prior.resolved_at = _now()
        carried_from = prior.id
    if baseline_assessment_id is None and priors:
        baseline_assessment_id = priors[-1].baseline_assessment_id

    event = ChangeEvent(
        requirement_id=requirement_id,
        kind=kind,
        status="open",
        impact=merged,
        diff=None,
        baseline_assessment_id=baseline_assessment_id,
        carried_from_event_id=carried_from,
        created_by=created_by,
    )
    session.add(event)
    session.flush()
    return event


from app.services.traceability.ids import coerce_uuid, coerce_uuids


def _uuids(ids) -> list:
    """Coerce string ids to UUID objects for UUID-keyed PK columns."""
    return coerce_uuids(ids)


def mark_stale(session, impact: dict) -> None:
    """Set freshness ``stale`` on every impacted artifact (same transaction)."""
    from app.models.assurance_decision import AssuranceDecision
    from app.models.risk_assessment import RiskAssessment
    from app.models.test_script import TestScript

    if impact.get("risks"):
        session.query(RiskAssessment).filter(
            RiskAssessment.id.in_(_uuids(impact["risks"]))
        ).update({"freshness": "stale"}, synchronize_session=False)
    if impact.get("assessments"):
        # Assessment rows ARE the risk rows in RAVEN's schema; the
        # assessment id list is a subset of the risk id list. Update both
        # spellings defensively so future splits stay correct.
        session.query(RiskAssessment).filter(
            RiskAssessment.id.in_(_uuids(impact["assessments"]))
        ).update({"freshness": "stale"}, synchronize_session=False)
    if impact.get("decisions"):
        session.query(AssuranceDecision).filter(
            AssuranceDecision.id.in_(_uuids(impact["decisions"]))
        ).update({"freshness": "stale"}, synchronize_session=False)
    if impact.get("tests"):
        session.query(TestScript).filter(
            TestScript.id.in_(_uuids(impact["tests"]))
        ).update({"freshness": "stale"}, synchronize_session=False)


def supersede_impact(session, impact: dict, reason: str) -> None:
    """Retire impacted generated artifacts on accept (spec 6.2)."""
    from app.models.assurance_decision import AssuranceDecision
    from app.models.risk_assessment import RiskAssessment
    from app.models.test_script import TestScript

    for model, key in (
        (RiskAssessment, "risks"),
        (RiskAssessment, "assessments"),
        (AssuranceDecision, "decisions"),
    ):
        if impact.get(key):
            session.query(model).filter(model.id.in_(_uuids(impact[key]))).update(
                {"freshness": "superseded"}, synchronize_session=False
            )
    if impact.get("tests"):
        # Only GENERATED tests are superseded; manual/imported stay stale
        # for human revalidation (spec 6.2, accept transition).
        _ = reason
        session.query(TestScript).filter(
            TestScript.id.in_(_uuids(impact["tests"])),
            TestScript.origin == "generated",
        ).update({"freshness": "superseded"}, synchronize_session=False)


def apply_reanalyzed(event, diff: dict) -> None:
    check_transition(event.status, "reanalyzed")
    event.diff = diff
    event.status = "reanalyzed"


def apply_confirmed(
    session, event, note: str, new_version_id=None, new_decision_id=None
) -> None:
    """Confirm-valid: re-point scripts, clear stale, retire old rows."""
    from app.models.assurance_decision import AssuranceDecision
    from app.models.risk_assessment import RiskAssessment
    from app.models.test_script import TestScript

    check_transition(event.status, "confirmed")
    if not event.diff or not event.diff.get("material_change") is False:
        raise InvalidStateError(
            "invalid_state: confirm-valid requires material_change=false"
        )
    if not note or len(note.strip()) < 10:
        raise ValueError("resolution note must be at least 10 characters")

    impact = event.impact or empty_impact()
    _require_successor_analysis(session, event, impact)

    test_ids = list(impact.get("tests", []))
    if test_ids:
        # Tests shared with another still-open event stay stale.
        shared = _tests_in_other_open_events(session, event, test_ids)
        generated_q = session.query(TestScript).filter(
            TestScript.id.in_(_uuids(test_ids)),
            TestScript.origin == "generated",
        )
        updates = {"freshness": "fresh"}
        if new_version_id is not None:
            updates["requirement_version_id"] = new_version_id
        if new_decision_id is not None:
            updates["assurance_decision_id"] = coerce_uuid(new_decision_id)
        if shared:
            generated_q = generated_q.filter(~TestScript.id.in_(_uuids(shared)))
        generated_q.update(updates, synchronize_session=False)
        manual_q = session.query(TestScript).filter(
            TestScript.id.in_(_uuids(test_ids)),
            TestScript.origin != "generated",
        )
        if shared:
            manual_q = manual_q.filter(~TestScript.id.in_(_uuids(shared)))
        manual_q.update({"freshness": "fresh"}, synchronize_session=False)

    for model, key in (
        (RiskAssessment, "risks"),
        (RiskAssessment, "assessments"),
        (AssuranceDecision, "decisions"),
    ):
        if impact.get(key):
            session.query(model).filter(model.id.in_(_uuids(impact[key]))).update(
                {"freshness": "superseded"}, synchronize_session=False
            )
    event.status = "confirmed"
    event.resolved_at = _now()
    event.resolution_note = note


def _require_successor_analysis(session, event, impact: dict) -> None:
    """Refuse confirm-valid when no fresh post-change analysis exists.

    Confirm retires the old rows and re-points scripts at the NEW risk.
    Without a successor analysis (created by the Agent 1 pipeline during
    reanalyze), confirming would silently orphan the requirement, so this
    is a 409, not a silent no-op.
    """
    from app.models.requirement import Requirement
    from app.models.risk_assessment import RiskAssessment

    requirement = session.get(Requirement, coerce_uuid(event.requirement_id))
    current_version_id = (
        requirement.current_version_id if requirement is not None else None
    )
    successors: list = []
    if current_version_id is not None:
        stale_ids = set(impact.get("risks", [])) | set(impact.get("assessments", []))
        successors = [
            r
            for r in session.query(RiskAssessment)
            .filter(
                RiskAssessment.requirement_version_id == current_version_id,
                RiskAssessment.freshness == "fresh",
            )
            .all()
            if str(r.id) not in stale_ids
        ]
    if not successors:
        raise InvalidStateError(
            "invalid_state: confirm-valid requires a fresh post-change "
            "analysis; run the analysis pipeline (reanalyze) first"
        )


def apply_accepted(session, event, note: str | None) -> None:
    check_transition(event.status, "accepted")
    supersede_impact(
        session,
        event.impact or empty_impact(),
        reason=f"requirement changed; change event {event.id} accepted",
    )
    event.status = "accepted"
    event.resolved_at = _now()
    event.resolution_note = note


def _tests_in_other_open_events(session, event, test_ids: list) -> set:
    from app.models.change_event import ChangeEvent

    others = (
        session.query(ChangeEvent)
        .filter(
            ChangeEvent.status.in_(["open", "reanalyzed"]),
            ChangeEvent.id != event.id,
        )
        .all()
    )
    shared: set = set()
    for other in others:
        shared |= set((other.impact or {}).get("tests", [])) & set(test_ids)
    return shared
