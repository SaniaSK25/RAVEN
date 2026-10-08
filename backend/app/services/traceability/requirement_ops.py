"""Requirement mutations with change-impact + sync (spec sections 5-6).

Every mutation runs in the caller's transaction: version bookkeeping,
impact computation over the pre-change snapshot, change-event
recording, stale marking, then :func:`sync_links`. No LLM is called
here; re-analysis goes through the Agent 1 pipeline via the
``POST /changes/{id}/reanalyze`` seam.
"""

from __future__ import annotations

import hashlib

from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.services.traceability.changeflow import empty_impact, mark_stale, record_change
from app.services.traceability.ids import coerce_uuid
from app.services.traceability.impact import compute_impact
from app.services.traceability.io import snapshot_from_db
from app.services.traceability.sync import sync_links


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def create_requirement(
    session,
    title: str,
    description: str,
    text: str | None,
    req_key: str | None,
    created_by: str,
) -> Requirement:
    """Create a requirement with its first version, then sync."""
    body = text if text is not None else description
    requirement = Requirement(
        title=title,
        description=description,
        req_key=req_key,
        status="DRAFT",
        created_by=created_by,
    )
    session.add(requirement)
    session.flush()
    version = RequirementVersion(
        requirement_id=requirement.id,
        version_number=1,
        text=body,
        hash_sha256=_hash(body),
        is_current=True,
    )
    session.add(version)
    session.flush()
    requirement.current_version_id = version.id
    session.flush()
    sync_links(session, requirement_ids={str(requirement.id)}, created_by=created_by)
    return requirement


def edit_requirement(session, requirement_id, new_text: str, edited_by: str) -> dict:
    """Append a new version; unchanged text creates no event (200 ``unchanged``)."""
    requirement_id = coerce_uuid(requirement_id)
    requirement = session.get(Requirement, requirement_id)
    if requirement is None:
        raise KeyError(f"requirement {requirement_id} not found")
    current = (
        session.get(RequirementVersion, requirement.current_version_id)
        if requirement.current_version_id is not None
        else None
    )
    new_hash = _hash(new_text)
    if current is not None and current.hash_sha256 == new_hash:
        return {"status": "unchanged", "requirement_id": str(requirement.id)}

    snapshot = snapshot_from_db(session)
    impact = compute_impact(
        snapshot,
        str(requirement.id),
        "edit",
        prior_open_events=_open_impacts(session, requirement.id),
    )

    if current is not None:
        current.is_current = False
        next_number = current.version_number + 1
    else:
        next_number = 1
    version = RequirementVersion(
        requirement_id=requirement.id,
        version_number=next_number,
        text=new_text,
        hash_sha256=new_hash,
        is_current=True,
    )
    session.add(version)
    session.flush()
    requirement.current_version_id = version.id
    requirement.description = new_text

    baseline = _baseline_assessment_id(snapshot, str(requirement.id))
    event = record_change(
        session,
        requirement.id,
        "edit",
        impact.to_dict(),
        created_by=edited_by,
        baseline_assessment_id=baseline,
    )
    mark_stale(session, impact.to_dict())
    sync_links(session, requirement_ids={str(requirement.id)}, created_by=edited_by)
    session.flush()
    return {
        "status": "changed",
        "requirement_id": str(requirement.id),
        "event_id": str(event.id),
        "impact": impact.to_dict(),
    }


def delete_requirement(session, requirement_id, deleted_by: str) -> dict:
    """Soft-delete (status RETIRED); linked tests become O2 ``requirement_deleted``."""
    from app.models.enums import RequirementStatus

    requirement_id = coerce_uuid(requirement_id)
    requirement = session.get(Requirement, requirement_id)
    if requirement is None:
        raise KeyError(f"requirement {requirement_id} not found")
    snapshot = snapshot_from_db(session)
    impact = compute_impact(
        snapshot,
        str(requirement.id),
        "delete",
        prior_open_events=_open_impacts(session, requirement.id),
    )
    requirement.status = RequirementStatus.RETIRED
    baseline = _baseline_assessment_id(snapshot, str(requirement.id))
    event = record_change(
        session,
        requirement.id,
        "delete",
        impact.to_dict(),
        created_by=deleted_by,
        baseline_assessment_id=baseline,
    )
    mark_stale(session, impact.to_dict())
    sync_links(session, requirement_ids={str(requirement.id)}, created_by=deleted_by)
    session.flush()
    return {
        "status": "deleted",
        "requirement_id": str(requirement.id),
        "event_id": str(event.id),
        "impact": impact.to_dict(),
    }


def _open_impacts(session, requirement_id) -> list[dict]:
    from app.models.change_event import ChangeEvent

    return [
        e.impact or empty_impact()
        for e in session.query(ChangeEvent)
        .filter(
            ChangeEvent.requirement_id == requirement_id,
            ChangeEvent.status.in_(["open", "reanalyzed"]),
        )
        .all()
    ]


def _baseline_assessment_id(snapshot, requirement_id: str) -> str | None:
    for risk in snapshot.risks.values():
        if (
            risk.requirement_id == requirement_id
            and risk.freshness == "fresh"
            and risk.is_current_version
        ):
            return risk.id
    return None
