"""Sync process applying derivation output to ``trace_links``.

Must run at the end of every mutation, in the same transaction (spec
section 3.2). Service functions in :mod:`app.services.traceability`
and the API routers call :func:`sync_links`; ``POST
/traceability/rebuild`` calls :func:`rebuild_links`.
"""

from __future__ import annotations

from app.models.trace_link import TraceLink
from app.services.traceability.derivation import derive_links
from app.services.traceability.io import snapshot_from_db
from app.services.traceability.stale import _freshness_of, link_stale


def _requirement_scope(snapshot, requirement_ids: set[str] | None) -> set[str] | None:
    if not requirement_ids:
        return None
    risk_ids = {
        r.id for r in snapshot.risks.values() if r.requirement_id in requirement_ids
    }
    decision_ids = {d.id for d in snapshot.decisions.values() if d.risk_id in risk_ids}
    test_ids = {
        t.id
        for t in snapshot.tests.values()
        if (t.risk_id in risk_ids if t.risk_id else False)
    }
    return (
        {("requirement", r) for r in requirement_ids}
        | {("risk", r) for r in risk_ids}
        | {("assurance", d) for d in decision_ids}
        | {("test", t) for t in test_ids}
    )


def _in_scope(key: tuple, scope: set | None) -> bool:
    if scope is None:
        return True
    _src_type, src_id, _dst_type, dst_id, _link_type = key
    return (
        ("requirement", src_id) in scope
        or ("requirement", dst_id) in scope
        or key[:2] in scope
        or key[2:4] in scope
    )


def sync_links(
    session,
    requirement_ids: list[str] | set[str] | None = None,
    created_by: str = "system",
) -> dict:
    """Apply derivation to ``trace_links`` inside the current transaction.

    Returns ``{"links_created", "links_reactivated", "links_deactivated",
    "links_total"}``. Never commits; the caller owns the transaction.
    """
    # Flush caller-pending changes first so derivation reads them, then
    # expire everything before the stale-flag pass: earlier bulk updates
    # (mark_stale et al.) bypass the identity map, and the snapshot must
    # see database state, not cached pre-update attribute values.
    session.flush()
    snapshot = snapshot_from_db(session)
    scope_ids = set(requirement_ids) if requirement_ids else None
    scope = _requirement_scope(snapshot, scope_ids) if scope_ids else None

    desired = {
        link.key(): link
        for link in derive_links(snapshot)
        if _in_scope(link.key(), scope)
    }

    existing = session.query(TraceLink).filter(TraceLink.origin == "system").all()
    if scope is not None:
        existing = [
            row
            for row in existing
            if (row.src_type, row.src_id) in scope
            or (row.dst_type, row.dst_id) in scope
        ]
    # Suppressed rows are left alone entirely: never reactivated, never
    # re-inserted, never deactivated (spec sections 1.3, 3.1).
    existing_by_key = {
        (r.src_type, r.src_id, r.dst_type, r.dst_id, r.link_type): r
        for r in existing
        if not r.suppressed
    }
    suppressed_keys = {
        (r.src_type, r.src_id, r.dst_type, r.dst_id, r.link_type)
        for r in existing
        if r.suppressed
    }

    created = reactivated = deactivated = 0
    for key, link in desired.items():
        if key in suppressed_keys:
            continue
        row = existing_by_key.get(key)
        if row is None:
            session.add(
                TraceLink(
                    src_type=link.src_type,
                    src_id=link.src_id,
                    dst_type=link.dst_type,
                    dst_id=link.dst_id,
                    link_type=link.link_type,
                    origin="system",
                    active=True,
                    suppressed=False,
                    stale=False,
                    created_by=created_by,
                )
            )
            created += 1
        elif not row.active:
            row.active = True
            reactivated += 1
    for key, row in existing_by_key.items():
        if key not in desired and row.active:
            row.active = False
            deactivated += 1

    session.flush()
    session.expire_all()
    _refresh_stale_flags(session, scope)
    session.flush()

    total = session.query(TraceLink).count()
    return {
        "links_created": created,
        "links_reactivated": reactivated,
        "links_deactivated": deactivated,
        "links_total": total,
    }


def _refresh_stale_flags(session, scope: set | None = None) -> None:
    snapshot = snapshot_from_db(session)
    query = session.query(TraceLink)
    for row in query.all():
        if (
            scope is not None
            and (row.src_type, row.src_id) not in scope
            and (row.dst_type, row.dst_id) not in scope
        ):
            continue
        row.stale = link_stale(
            _freshness_of(snapshot, row.src_type, row.src_id),
            _freshness_of(snapshot, row.dst_type, row.dst_id),
        )


def rebuild_links(session, created_by: str = "system") -> dict:
    """Full rebuild: idempotent reset valve (spec section 10)."""
    return sync_links(session, requirement_ids=None, created_by=created_by)
