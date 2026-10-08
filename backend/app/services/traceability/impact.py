"""Change impact computation (spec section 5). Pure function.

Only FRESH artifacts are included; already-stale items are not
re-listed. Tests of any origin linked via an active ``verifies`` link
go stale when ANY requirement they verify changes.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Impact:
    risks: tuple[str, ...] = ()
    assessments: tuple[str, ...] = ()
    decisions: tuple[str, ...] = ()
    tests: tuple[str, ...] = ()
    links: tuple[str, ...] = ()

    def to_dict(self) -> dict:
        return {
            "risks": sorted(self.risks),
            "assessments": sorted(self.assessments),
            "decisions": sorted(self.decisions),
            "tests": sorted(self.tests),
            "links": sorted(self.links),
        }


def _union(base: set[str], extra: list[str] | tuple[str, ...] | set[str]) -> set[str]:
    return base | set(extra or [])


def compute_impact(
    snapshot, requirement_id: str, kind: str, prior_open_events: list | None = None
) -> Impact:
    """Return the exact set of artifact ids that should be marked stale."""
    _ = kind  # edit and delete share the same impact formula.

    # Step 1: fresh risks of the current (pre-change) version.
    risks = {
        risk.id
        for risk in snapshot.risks.values()
        if risk.requirement_id == requirement_id
        and risk.freshness == "fresh"
        and risk.is_current_version
    }
    # Step 2: fresh assessments of those risks.
    assessments = {
        assessment.id
        for assessment in snapshot.assessments.values()
        if assessment.risk_id in risks and assessment.freshness == "fresh"
    }
    # Step 3: fresh decisions of those assessments.
    decisions = {
        decision.id
        for decision in snapshot.decisions.values()
        if decision.assessment_id in assessments and decision.freshness == "fresh"
    }
    # Step 4: fresh tests verifying this requirement (any origin).
    verifying_test_ids = {
        link.src_id
        for link in snapshot.links
        if link.link_type == "verifies"
        and link.dst_type == "requirement"
        and link.dst_id == requirement_id
        and link.active
    }
    tests = {
        test.id
        for test in snapshot.tests.values()
        if test.id in verifying_test_ids and test.freshness == "fresh"
    }
    # Step 5: links touching any impacted node.
    impacted_nodes = (
        {("requirement", requirement_id)}
        | {("risk", r_id) for r_id in risks}
        | {("assurance", d_id) for d_id in decisions}
        | {("test", t_id) for t_id in tests}
    )
    links = {
        link.id
        for link in snapshot.links
        if (link.src_type, link.src_id) in impacted_nodes
        or (link.dst_type, link.dst_id) in impacted_nodes
    }

    # Step 6: union with prior open events for this requirement.
    for prior in prior_open_events or []:
        prior_impact = prior if isinstance(prior, dict) else prior.to_dict()
        risks = _union(risks, prior_impact.get("risks"))
        assessments = _union(assessments, prior_impact.get("assessments"))
        decisions = _union(decisions, prior_impact.get("decisions"))
        tests = _union(tests, prior_impact.get("tests"))
        links = _union(links, prior_impact.get("links"))

    return Impact(
        risks=tuple(sorted(risks)),
        assessments=tuple(sorted(assessments)),
        decisions=tuple(sorted(decisions)),
        tests=tuple(sorted(tests)),
        links=tuple(sorted(links)),
    )
