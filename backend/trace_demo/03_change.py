"""Demo step 3: change impact — edit, reanalyze/confirm, delete.

Usage:  .venv/Scripts/python.exe trace_demo/03_change.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from trace_demo.common import get_session  # noqa: E402

from app.models.change_event import ChangeEvent  # noqa: E402
from app.models.requirement import Requirement  # noqa: E402
from app.models.trace_link import TraceLink  # noqa: E402
from app.services.traceability.changediff import compute_diff  # noqa: E402
from app.services.traceability.changeflow import (  # noqa: E402
    apply_accepted,
    apply_confirmed,
    apply_reanalyzed,
)
from app.services.traceability.graph import build_graph  # noqa: E402
from app.services.traceability.io import snapshot_from_db  # noqa: E402
from app.services.traceability.orphans import find_orphans, orphan_summary  # noqa: E402
from app.services.traceability.requirement_ops import (  # noqa: E402
    delete_requirement,
    edit_requirement,
)
from app.services.traceability.sync import sync_links  # noqa: E402

session = get_session()
reqs = {r.req_key: r for r in session.query(Requirement).all()}


def report(label):
    orphans = find_orphans(snapshot_from_db(session))
    stale = session.query(TraceLink).filter(TraceLink.stale.is_(True)).count()
    print(f"{label}: orphans={orphan_summary(orphans)} stale_links={stale}")
    for o in orphans:
        print(f"    {o.type} {o.entity_key} [{o.reason}]")


def simulate_pipeline(session, requirement, scores):
    """Persist a new analysis for the requirement's current version.

    Production equivalent: Agent 1 evidence + Layer 3/4 engines with
    force=true. Values here are placeholders for the demo.
    """
    from app.models.assurance_decision import AssuranceDecision
    from app.models.configuration_version import ConfigurationVersion
    from app.models.engine_results import (
        DetectabilityResult,
        ProbabilityResult,
        SeverityResult,
    )
    from app.models.enums import AssuranceLevel, RiskBand
    from app.models.risk_assessment import RiskAssessment
    from app.models.stored_evidence import (
        COMPLEXITY_FIELDS,
        DETECTION_FIELDS,
        SEVERITY_FIELDS,
        Evidence,
    )

    fields = {"requirement_version_id": requirement.current_version_id}
    for name in SEVERITY_FIELDS:
        fields[f"{name}_value"] = False
        fields[f"{name}_confidence"] = 0.9
        fields[f"{name}_evidence"] = "demo placeholder"
    for name in COMPLEXITY_FIELDS:
        fields[f"{name}_value"] = "MEDIUM"
        fields[f"{name}_confidence"] = 0.9
        fields[f"{name}_evidence"] = "demo placeholder"
    for name in DETECTION_FIELDS:
        fields[f"{name}_value"] = "MEDIUM"
        fields[f"{name}_confidence"] = 0.9
        fields[f"{name}_evidence"] = "demo placeholder"
    fields.update(
        gxp_impact_value=False, gxp_impact_confidence=0.9,
        gxp_impact_evidence="demo placeholder", gxp_reason="demo",
        gamp_category_value=4, gamp_category_confidence=0.9,
        gamp_category_evidence="demo placeholder", gamp_reason="demo",
    )
    evidence = Evidence(**fields)
    session.add(evidence)
    session.flush()
    config = session.query(ConfigurationVersion).first()
    risk = RiskAssessment(
        requirement_version_id=requirement.current_version_id,
        evidence_id=evidence.id, rule_config_version_id=config.id,
        gxp_impact=True, gxp_reason="demo", gamp_category="4",
        gamp_reason="demo", rpn=scores["rpn"], band=RiskBand.HIGH,
        status="FINAL", is_current=True,
    )
    session.add(risk)
    session.flush()
    for model, score, rule in (
        (SeverityResult, scores["severity"], "SEV-Rx"),
        (ProbabilityResult, scores["probability"], "PROB-Sx"),
        (DetectabilityResult, scores["detectability"], "DET-Sx"),
    ):
        extra = (
            {"weighted_sum": 7.0, "gamp_modifier": 0.0}
            if model is ProbabilityResult
            else {"controls_floor": None} if model is DetectabilityResult else {}
        )
        session.add(
            model(
                risk_assessment_id=risk.id, score=score, rule_id=rule,
                rule_version="1", decision_path=[], reasoning="demo", **extra
            )
        )
    decision = AssuranceDecision(
        risk_assessment_id=risk.id, assurance_level=AssuranceLevel.SCRIPTED,
        rule_id=scores["reason_code"], rule_version="1", generate_test=True,
        reasoning="demo", decision_path={},
    )
    session.add(decision)
    session.flush()
    session.commit()
    print(f"pipeline: new analysis {str(risk.id)[:8]} -> {str(decision.id)[:8]}")
    return str(decision.id)


print("=== 1. Edit LIMS-001 (scripted, 2 scripts) ===")
out = edit_requirement(
    session, reqs["LIMS-001"].id, "The system shall enforce UNIQUE user IDs.", "demo"
)
session.commit()
print(f"impact: {out['impact']}")
report("after edit")

print("\n=== 2. Reanalyze (non-material) + confirm-valid ===")
event = session.query(ChangeEvent).filter(
    ChangeEvent.requirement_id == reqs["LIMS-001"].id,
    ChangeEvent.status == "open",
).one()
after = {
    "severity": 4, "probability": 4, "detectability": 4, "rpn": 64,
    "band": "High", "gxp_impact": True, "gamp_category": "4",
    "level": "scripted", "reason_code": "ASR-BAND-HIGH",
}
apply_reanalyzed(event, compute_diff({**after, "severity": 5}, after))
print(f"diff: material={event.diff['material_change']} "
      f"changed={event.diff['changed_fields']}")

# Stand-in for the Agent 1 pipeline: persist a new analysis for the new
# version (production rows come from Agent 1 + engines, not placeholders).
new_decision_id = simulate_pipeline(session, reqs["LIMS-001"], after)
apply_confirmed(
    session, event, "Reviewed: wording only, still valid.",
    new_version_id=reqs["LIMS-001"].current_version_id,
    new_decision_id=new_decision_id,
)
sync_links(session, requirement_ids={str(reqs["LIMS-001"].id)})
session.commit()
print(f"event -> {event.status}")
report("after confirm")

print("\n=== 3. Delete LIMS-005 (scripted, 1 script) ===")
out = delete_requirement(session, reqs["LIMS-005"].id, "demo")
session.commit()
print(f"impact tests: {out['impact']['tests']}")
report("after delete")

print("\n=== 4. Accept the delete event ===")
event = session.query(ChangeEvent).filter(
    ChangeEvent.requirement_id == reqs["LIMS-005"].id,
    ChangeEvent.status == "open",
).one()
apply_accepted(session, event, "Requirement withdrawn.")
sync_links(session, requirement_ids={str(reqs["LIMS-005"].id)})
session.commit()
print(f"event -> {event.status}")
report("final")

graph = build_graph(snapshot_from_db(session), find_orphans(snapshot_from_db(session)))
print(f"\ngraph summary: {graph['summary']}")
