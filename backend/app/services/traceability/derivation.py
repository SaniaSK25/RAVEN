"""Link derivation (spec section 2). Pure function over a snapshot.

Rules D1-D4. Superseded artifacts produce no links; manual/imported
tests get no derived ``mitigated_by``/``verifies`` links; stale flags
are NOT set here (sync refreshes them afterwards).
"""

from __future__ import annotations

from app.services.traceability.snapshot import DesiredLink, TraceSnapshot


def derive_links(snapshot: TraceSnapshot) -> list[DesiredLink]:
    """Return the complete set of system links that should exist."""
    desired: dict[tuple[str, str, str, str, str], DesiredLink] = {}

    def add(link: DesiredLink) -> None:
        desired.setdefault(link.key(), link)

    # --- D1: has_risk -------------------------------------------------
    for risk in snapshot.risks.values():
        if risk.freshness == "superseded":
            continue
        if risk.requirement_id not in snapshot.requirements:
            continue
        add(
            DesiredLink(
                src_type="requirement",
                src_id=risk.requirement_id,
                dst_type="risk",
                dst_id=risk.id,
                link_type="has_risk",
            )
        )

    # Fresh (non-superseded) decisions grouped for D2/D3.
    fresh_decisions_by_assessment: dict[str, list] = {}
    fresh_decisions_by_risk: dict[str, list] = {}
    for decision in snapshot.decisions.values():
        if decision.freshness == "superseded":
            continue
        fresh_decisions_by_assessment.setdefault(decision.assessment_id, []).append(
            decision
        )
        fresh_decisions_by_risk.setdefault(decision.risk_id, []).append(decision)

    # --- D2: assessed_as ----------------------------------------------
    for assessment in snapshot.assessments.values():
        if assessment.freshness == "superseded":
            continue
        risk = snapshot.risks.get(assessment.risk_id)
        if risk is None or risk.freshness == "superseded":
            continue
        for decision in fresh_decisions_by_assessment.get(assessment.id, []):
            add(
                DesiredLink(
                    src_type="risk",
                    src_id=assessment.risk_id,
                    dst_type="assurance",
                    dst_id=decision.id,
                    link_type="assessed_as",
                )
            )

    # --- D3/D4: generated scripts only --------------------------------
    for test in snapshot.tests.values():
        if test.origin != "generated":
            continue
        if test.freshness == "superseded":
            continue
        if not test.risk_id:
            continue
        risk = snapshot.risks.get(test.risk_id)
        if risk is None or risk.freshness == "superseded":
            continue
        if risk.requirement_id not in snapshot.requirements:
            continue
        # D3: mitigated_by from the current decision for the risk.
        for decision in fresh_decisions_by_risk.get(test.risk_id, []):
            add(
                DesiredLink(
                    src_type="assurance",
                    src_id=decision.id,
                    dst_type="test",
                    dst_id=test.id,
                    link_type="mitigated_by",
                )
            )
        # D4: verifies from the test to the requirement owning the risk.
        add(
            DesiredLink(
                src_type="test",
                src_id=test.id,
                dst_type="requirement",
                dst_id=risk.requirement_id,
                link_type="verifies",
            )
        )

    return [desired[key] for key in sorted(desired)]
