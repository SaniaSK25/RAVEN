"""Orphan detection (spec section 4). Pure function over a snapshot.

Three orphan types:

- O1: active requirement with no coverage. Covered = (a fresh test with
  an active ``verifies`` link) OR (a fresh exploratory/unscripted
  assurance decision reachable via active links). Supplier-leverage and
  exploratory requirements are NOT orphans.
- O2: fresh/stale test with no active ``verifies`` link to an active
  requirement.
- O3: fresh risk of an active requirement with no active
  ``assessed_as`` link to a fresh assurance decision.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.services.traceability.snapshot import TraceSnapshot

_NON_SCRIPTED_LEVELS = ("exploratory", "unscripted")


@dataclass(frozen=True)
class Orphan:
    type: str  # "O1" | "O2" | "O3"
    entity_type: str  # "requirement" | "test" | "risk"
    entity_id: str
    entity_key: str
    reason: str
    detail: str


def _active_links(snapshot: TraceSnapshot, link_type: str) -> list:
    return [
        link for link in snapshot.links if link.link_type == link_type and link.active
    ]


def orphan_summary(orphans: list[Orphan]) -> dict:
    return {
        "O1": len([o for o in orphans if o.type == "O1"]),
        "O2": len([o for o in orphans if o.type == "O2"]),
        "O3": len([o for o in orphans if o.type == "O3"]),
        "total": len(orphans),
    }


def find_orphans(snapshot: TraceSnapshot) -> list[Orphan]:
    orphans: list[Orphan] = []
    verifies = _active_links(snapshot, "verifies")
    has_risk = _active_links(snapshot, "has_risk")
    assessed_as = _active_links(snapshot, "assessed_as")

    verifies_by_req: dict[str, list] = {}
    for link in verifies:
        verifies_by_req.setdefault(link.dst_id, []).append(link)
    risks_by_req: dict[str, list] = {}
    for link in has_risk:
        risks_by_req.setdefault(link.src_id, []).append(link.dst_id)
    decisions_by_risk: dict[str, list] = {}
    for link in assessed_as:
        decisions_by_risk.setdefault(link.src_id, []).append(link.dst_id)

    orphans.extend(_find_o1(snapshot, verifies_by_req, risks_by_req, decisions_by_risk))
    orphans.extend(_find_o2(snapshot, verifies))
    orphans.extend(_find_o3(snapshot, risks_by_req, decisions_by_risk))

    orphans.sort(key=lambda o: (o.type, o.entity_key))
    return orphans


def _fresh_decisions_for_requirement(
    snapshot: TraceSnapshot,
    requirement_id: str,
    risks_by_req: dict,
    decisions_by_risk: dict,
) -> list:
    """Fresh decisions reachable from a requirement via active links."""
    out = []
    for risk_id in risks_by_req.get(requirement_id, []):
        risk = snapshot.risks.get(risk_id)
        if risk is None or risk.freshness != "fresh":
            continue
        for decision_id in decisions_by_risk.get(risk_id, []):
            decision = snapshot.decisions.get(decision_id)
            if decision is not None and decision.freshness == "fresh":
                out.append(decision)
    return out


def _find_o1(
    snapshot, verifies_by_req, risks_by_req, decisions_by_risk
) -> list[Orphan]:
    orphans: list[Orphan] = []
    for req in snapshot.requirements.values():
        if req.status != "active":
            continue
        # Condition 1: a fresh test verifies this requirement.
        fresh_test_cover = any(
            (test := snapshot.tests.get(link.src_id)) is not None
            and test.freshness == "fresh"
            for link in verifies_by_req.get(req.id, [])
        )
        # Condition 2: a fresh exploratory/unscripted decision exists.
        fresh_decisions = _fresh_decisions_for_requirement(
            snapshot, req.id, risks_by_req, decisions_by_risk
        )
        nonscripted_cover = any(
            d.level in _NON_SCRIPTED_LEVELS for d in fresh_decisions
        )
        if fresh_test_cover or nonscripted_cover:
            continue
        reason, detail = _o1_reason(
            snapshot, req, verifies_by_req, risks_by_req, decisions_by_risk
        )
        orphans.append(
            Orphan(
                type="O1",
                entity_type="requirement",
                entity_id=req.id,
                entity_key=req.req_key,
                reason=reason,
                detail=detail,
            )
        )
    return orphans


def _o1_reason(
    snapshot, req, verifies_by_req, risks_by_req, decisions_by_risk
) -> tuple[str, str]:
    risk_ids = risks_by_req.get(req.id, [])
    live_risks = [
        snapshot.risks[r_id]
        for r_id in risk_ids
        if r_id in snapshot.risks and snapshot.risks[r_id].freshness != "superseded"
    ]
    fresh_risks = [r for r in live_risks if r.freshness == "fresh"]
    fresh_decisions = _fresh_decisions_for_requirement(
        snapshot, req.id, risks_by_req, decisions_by_risk
    )

    # Priority 1: a fresh scripted decision exists but no fresh test verifies.
    if any(d.level == "scripted" for d in fresh_decisions):
        return (
            "scripted_no_tests",
            (
                f"Requirement {req.req_key} has a fresh scripted assurance decision "
                "but no fresh test verifies it."
            ),
        )
    # Priority 2: a fresh risk exists but no fresh assurance decision.
    if fresh_risks and not fresh_decisions:
        return (
            "no_assurance",
            f"Requirement {req.req_key} has a fresh risk but no fresh assurance decision.",
        )
    # Priority 3: only stale artifacts remain linked.
    has_stale = (
        any(r.freshness == "stale" for r in live_risks)
        or any(
            (d := snapshot.decisions.get(d_id)) is not None and d.freshness == "stale"
            for r_id in risk_ids
            for d_id in decisions_by_risk.get(r_id, [])
        )
        or any(
            (t := snapshot.tests.get(link.src_id)) is not None
            and t.freshness == "stale"
            for link in verifies_by_req.get(req.id, [])
        )
    )
    if has_stale:
        return (
            "stale_only",
            f"Requirement {req.req_key} is linked only to stale risks, decisions or tests.",
        )
    # Priority 4: never analysed.
    return (
        "not_analyzed",
        f"Requirement {req.req_key} has no non-superseded risk linked to it.",
    )


def _test_display_key(snapshot: TraceSnapshot, test_id: str) -> str:
    test = snapshot.tests.get(test_id)
    if test is None:
        return test_id
    if test.external_code:
        return test.external_code
    return f"TS-{test_id[:8]}"


def _find_o2(snapshot: TraceSnapshot, verifies: list) -> list[Orphan]:
    orphans: list[Orphan] = []
    links_by_test: dict[str, list] = {}
    for link in verifies:
        links_by_test.setdefault(link.src_id, []).append(link)
    for test in snapshot.tests.values():
        if test.freshness not in ("fresh", "stale"):
            continue
        test_links = links_by_test.get(test.id, [])
        if not test_links:
            orphans.append(
                Orphan(
                    type="O2",
                    entity_type="test",
                    entity_id=test.id,
                    entity_key=_test_display_key(snapshot, test.id),
                    reason="no_links",
                    detail=f"Test {_test_display_key(snapshot, test.id)} has no active "
                    "verifies links to any requirement.",
                )
            )
        elif all(
            (req := snapshot.requirements.get(link.dst_id)) is None
            or req.status == "deleted"
            for link in test_links
        ):
            orphans.append(
                Orphan(
                    type="O2",
                    entity_type="test",
                    entity_id=test.id,
                    entity_key=_test_display_key(snapshot, test.id),
                    reason="requirement_deleted",
                    detail=f"Test {_test_display_key(snapshot, test.id)} is linked only "
                    "to deleted requirements.",
                )
            )
    return orphans


def _risk_display_key(snapshot: TraceSnapshot, risk: str | object) -> str:
    risk_id = risk if isinstance(risk, str) else risk.id
    return f"RSK-{risk_id[:8]}"


def _find_o3(snapshot, risks_by_req, decisions_by_risk) -> list[Orphan]:
    orphans: list[Orphan] = []
    for risk in snapshot.risks.values():
        if risk.freshness != "fresh":
            continue
        req = snapshot.requirements.get(risk.requirement_id)
        if req is None or req.status != "active":
            continue
        # The risk must be reachable via an active has_risk link.
        if risk.id not in risks_by_req.get(risk.requirement_id, []):
            continue
        has_fresh_decision = any(
            (d := snapshot.decisions.get(d_id)) is not None and d.freshness == "fresh"
            for d_id in decisions_by_risk.get(risk.id, [])
        )
        if not has_fresh_decision:
            key = _risk_display_key(snapshot, risk)
            orphans.append(
                Orphan(
                    type="O3",
                    entity_type="risk",
                    entity_id=risk.id,
                    entity_key=key,
                    reason="no_mitigation",
                    detail=f"Risk {key} for requirement {req.req_key} has no fresh "
                    "assurance decision.",
                )
            )
    return orphans
