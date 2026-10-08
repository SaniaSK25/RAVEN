"""Layer 6 integration tests (TRACEABILITY MATRIX spec, section 9.2).

Real SQLite database (in-memory): sync convergence, rebuild, suppressed
links surviving rebuild, the change state machine, and CSV import. No
LLM is involved in any path exercised here.
"""

import hashlib
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.assurance_decision import AssuranceDecision
from app.models.change_event import ChangeEvent
from app.models.configuration_version import ConfigurationVersion
from app.models.enums import (
    AssuranceLevel,
    RequirementStatus,
    RiskBand,
    TestScriptStatus,
)
from app.models.prompt_version import PromptVersion
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.test_script import TestScript
from app.models.trace_link import TraceLink
from app.services.traceability.changediff import compute_diff
from app.services.traceability.changeflow import (
    InvalidStateError,
    apply_accepted,
    apply_confirmed,
    apply_reanalyzed,
)
from app.services.traceability.io import snapshot_from_db
from app.services.traceability.matrix import (
    build_matrix,
    matrix_to_csv,
    parse_import_csv,
)
from app.services.traceability.orphans import find_orphans
from app.services.traceability.requirement_ops import (
    delete_requirement,
    edit_requirement,
)
from app.services.traceability.sync import rebuild_links, sync_links
from app.services.traceability.trace_import import apply_import

# Pytest must not try to collect these imported ORM names as test classes.
TestScript.__test__ = False
TestScriptStatus.__test__ = False


def make_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def seed_scripted(session, key="LIMS-001"):
    """One analysed scripted requirement with one generated script."""
    config = ConfigurationVersion(version="1.0.0", config_hash="a" * 64)
    prompt = PromptVersion(agent_name="gen", version=1, prompt="p", hash="b" * 64)
    session.add_all([config, prompt])
    session.flush()
    req = Requirement(
        title="T",
        description="original text",
        req_key=key,
        status=RequirementStatus.DRAFT,
        created_by="t",
    )
    session.add(req)
    session.flush()
    version = RequirementVersion(
        requirement_id=req.id,
        version_number=1,
        text="original text",
        hash_sha256=hashlib.sha256(b"original text").hexdigest(),
        is_current=True,
    )
    session.add(version)
    session.flush()
    req.current_version_id = version.id
    risk = RiskAssessment(
        requirement_version_id=version.id,
        evidence_id=uuid.uuid4(),
        rule_config_version_id=config.id,
        gxp_impact=True,
        gxp_reason="g",
        gamp_category="4",
        gamp_reason="g",
        rpn=3.75,
        rpn_points=75,
        band=RiskBand.HIGH,
        status="FINAL",
        is_current=True,
    )
    session.add(risk)
    session.flush()
    decision = AssuranceDecision(
        risk_assessment_id=risk.id,
        assurance_level=AssuranceLevel.SCRIPTED,
        rule_id="ASR-BAND-HIGH",
        rule_version="1",
        generate_test=True,
        reasoning="r",
        decision_path={},
    )
    session.add(decision)
    session.flush()
    script = TestScript(
        requirement_version_id=version.id,
        assurance_decision_id=decision.id,
        prompt_version_id=prompt.id,
        script="steps",
        status=TestScriptStatus.DRAFT,
        version=1,
    )
    session.add(script)
    session.flush()
    return {"req": req, "risk": risk, "decision": decision, "script": script}


class TestSync:
    def test_full_analysis_produces_exactly_four_links(self):
        session = make_session()
        seed_scripted(session)
        counts = sync_links(session)
        assert (
            counts["links_created"] == 4
        )  # has_risk, assessed_as, mitigated_by, verifies
        assert {l.link_type for l in session.query(TraceLink).all()} == {
            "has_risk",
            "assessed_as",
            "mitigated_by",
            "verifies",
        }

    def test_healthy_state_has_zero_orphans(self):
        session = make_session()
        seed_scripted(session)
        sync_links(session)
        assert find_orphans(snapshot_from_db(session)) == []

    def test_running_sync_twice_changes_zero_rows(self):
        session = make_session()
        seed_scripted(session)
        sync_links(session)
        second = sync_links(session)
        assert second["links_created"] == 0
        assert second["links_reactivated"] == 0
        assert second["links_deactivated"] == 0

    def test_rebuild_after_clearing_system_links_restores_all(self):
        session = make_session()
        seed_scripted(session)
        sync_links(session)
        session.query(TraceLink).delete()
        counts = rebuild_links(session)
        assert counts["links_created"] == 4
        assert session.query(TraceLink).count() == 4

    def test_suppressed_link_not_resurrected_by_sync_or_rebuild(self):
        session = make_session()
        seed_scripted(session)
        sync_links(session)
        verifies = (
            session.query(TraceLink).filter(TraceLink.link_type == "verifies").one()
        )
        verifies.suppressed = True
        verifies.active = False
        sync_links(session)
        rebuild_links(session)
        row = session.query(TraceLink).filter(TraceLink.link_type == "verifies").one()
        assert row.suppressed is True and row.active is False
        orphans = find_orphans(snapshot_from_db(session))
        assert {o.type for o in orphans} == {"O1", "O2"}

    def test_manual_links_survive_rebuild_unchanged(self):
        session = make_session()
        seed = seed_scripted(session)
        sync_links(session)
        manual = TestScript(
            requirement_version_id=seed["req"].current_version_id,
            assurance_decision_id=None,
            prompt_version_id=session.query(PromptVersion).one().id,
            script="manual steps",
            status=TestScriptStatus.DRAFT,
            version=1,
            origin="manual",
            title="Manual check",
        )
        session.add(manual)
        session.flush()
        session.add(
            TraceLink(
                src_type="test",
                src_id=str(manual.id),
                dst_type="requirement",
                dst_id=str(seed["req"].id),
                link_type="verifies",
                origin="manual",
                active=True,
                suppressed=False,
                stale=False,
                created_by="t",
            )
        )
        session.flush()
        rebuild_links(session)
        row = session.query(TraceLink).filter(TraceLink.origin == "manual").one()
        assert row.active is True


class TestChangeFlow:
    def test_edit_marks_exact_stale_set(self):
        session = make_session()
        seed = seed_scripted(session)
        sync_links(session)
        outcome = edit_requirement(session, seed["req"].id, "changed text", "t")
        assert outcome["status"] == "changed"
        assert set(outcome["impact"]["risks"]) == {str(seed["risk"].id)}
        assert set(outcome["impact"]["decisions"]) == {str(seed["decision"].id)}
        assert set(outcome["impact"]["tests"]) == {str(seed["script"].id)}
        session.refresh(seed["risk"])
        session.refresh(seed["decision"])
        session.refresh(seed["script"])
        assert seed["risk"].freshness == "stale"
        assert seed["decision"].freshness == "stale"
        assert seed["script"].freshness == "stale"
        stale_links = session.query(TraceLink).filter(TraceLink.stale.is_(True)).count()
        assert stale_links == 4
        orphans = find_orphans(snapshot_from_db(session))
        assert any(o.type == "O1" and o.reason == "stale_only" for o in orphans)

    def test_identical_text_edit_creates_no_event(self):
        session = make_session()
        seed = seed_scripted(session)
        outcome = edit_requirement(session, seed["req"].id, "original text", "t")
        assert outcome == {"status": "unchanged", "requirement_id": str(seed["req"].id)}
        assert session.query(ChangeEvent).count() == 0

    def test_second_edit_supersedes_first_with_union_impact(self):
        session = make_session()
        seed = seed_scripted(session)
        sync_links(session)
        first = edit_requirement(session, seed["req"].id, "text v2", "t")
        second = edit_requirement(session, seed["req"].id, "text v3", "t")
        first_event = session.get(ChangeEvent, uuid.UUID(first["event_id"]))
        assert first_event.status == "superseded"
        second_event = session.get(ChangeEvent, uuid.UUID(second["event_id"]))
        assert second_event.status == "open"
        assert second_event.carried_from_event_id == first_event.id
        assert set(second_event.impact["risks"]) >= set(first_event.impact["risks"])

    def test_delete_marks_stale_and_test_becomes_o2(self):
        session = make_session()
        seed = seed_scripted(session)
        sync_links(session)
        outcome = delete_requirement(session, seed["req"].id, "t")
        assert outcome["status"] == "deleted"
        orphans = find_orphans(snapshot_from_db(session))
        assert any(
            o.type == "O2" and o.reason == "requirement_deleted" for o in orphans
        )

    def test_reanalyze_confirm_cycle(self):
        session = make_session()
        seed = seed_scripted(session)
        sync_links(session)
        outcome = edit_requirement(session, seed["req"].id, "changed text", "t")
        event = session.get(ChangeEvent, uuid.UUID(outcome["event_id"]))
        after = {
            "severity": 4,
            "probability": 3,
            "detectability": 4,
            "rpn": 3.75,
            "band": "High",
            "gxp_impact": True,
            "gamp_category": "4",
            "level": "scripted",
            "reason_code": "ASR-BAND-HIGH",
        }
        before = dict(after, severity=5)
        apply_reanalyzed(event, compute_diff(before, after))
        assert event.status == "reanalyzed"
        assert event.diff["material_change"] is False
        # Confirming an open event is rejected with invalid_state.
        open_event = ChangeEvent(
            requirement_id=seed["req"].id,
            kind="edit",
            status="open",
            impact=event.impact,
            created_by="t",
        )
        try:
            apply_confirmed(session, open_event, "a sufficient note here")
        except InvalidStateError:
            pass
        else:
            raise AssertionError("confirming an open event must fail")
        # Confirming without a successor analysis is also rejected: it
        # would silently orphan the requirement.
        try:
            apply_confirmed(session, event, "still valid after review")
        except InvalidStateError:
            pass
        else:
            raise AssertionError("confirming without new analysis must fail")
        # Pipeline stand-in: fresh analysis of the new current version.
        session.refresh(seed["req"])
        successor = RiskAssessment(
            requirement_version_id=seed["req"].current_version_id,
            evidence_id=uuid.uuid4(),
            rule_config_version_id=seed["risk"].rule_config_version_id,
            gxp_impact=True,
            gxp_reason="g",
            gamp_category="4",
            gamp_reason="g",
            rpn=3.75,
            rpn_points=75,
            band=RiskBand.HIGH,
            status="FINAL",
            is_current=True,
        )
        session.add(successor)
        session.flush()
        apply_confirmed(session, event, "still valid after review")
        assert event.status == "confirmed"
        session.refresh(seed["script"])
        assert seed["script"].freshness == "fresh"

    def test_accept_supersedes_generated_but_keeps_manual_stale(self):
        session = make_session()
        seed = seed_scripted(session)
        sync_links(session)
        manual = TestScript(
            requirement_version_id=seed["req"].current_version_id,
            assurance_decision_id=None,
            prompt_version_id=session.query(PromptVersion).one().id,
            script="manual steps",
            status=TestScriptStatus.DRAFT,
            version=1,
            origin="manual",
            title="Manual check",
        )
        session.add(manual)
        session.flush()
        session.add(
            TraceLink(
                src_type="test",
                src_id=str(manual.id),
                dst_type="requirement",
                dst_id=str(seed["req"].id),
                link_type="verifies",
                origin="manual",
                active=True,
                suppressed=False,
                stale=False,
                created_by="t",
            )
        )
        session.flush()
        outcome = edit_requirement(session, seed["req"].id, "changed text", "t")
        assert str(manual.id) in outcome["impact"]["tests"]
        event = session.get(ChangeEvent, uuid.UUID(outcome["event_id"]))
        apply_accepted(session, event, None)
        assert event.status == "accepted"
        session.refresh(seed["script"])
        session.refresh(manual)
        assert seed["script"].freshness == "superseded"
        assert manual.freshness == "stale"


class TestImport:
    def test_import_creates_links_and_rebuild_keeps_them(self):
        session = make_session()
        seed_scripted(session)
        sync_links(session)
        rows = build_matrix(snapshot_from_db(session), [])
        parsed = parse_import_csv(matrix_to_csv(rows))
        summary = apply_import(session, parsed, mode="merge", created_by="t")
        # Generated pairs already have system links -> no duplicates created.
        # Other matrix columns are ignored with a warning (spec 7.5).
        assert summary["links_created"] == 0
        assert any("ignored columns" in w for w in summary["warnings"])
        # An external test row creates an imported test + link.
        external = parse_import_csv(
            "requirement_id,test_id\nLIMS-001,EXT-9000\nUNKNOWN-1,EXT-9001\n"
        )
        summary = apply_import(session, external, mode="merge", created_by="t")
        assert summary["links_created"] == 1
        assert summary["test_unlinked"] == 1
        assert any("unknown requirement" in w for w in summary["warnings"])
        rebuild_links(session)
        assert (
            session.query(TraceLink).filter(TraceLink.origin == "import").count() == 1
        )

    def test_replace_imported_deactivates_old_import_links(self):
        session = make_session()
        seed_scripted(session)
        first = parse_import_csv("requirement_id,test_id\nLIMS-001,EXT-1\n")
        apply_import(session, first, mode="merge")
        second = parse_import_csv("requirement_id,test_id\nLIMS-001,EXT-2\n")
        apply_import(session, second, mode="replace_imported")
        active = (
            session.query(TraceLink)
            .filter(TraceLink.origin == "import", TraceLink.active.is_(True))
            .all()
        )
        assert len(active) == 1


class TestAppWiring:
    def test_routers_register_expected_paths(self):
        from app.main import app

        paths = set(app.openapi()["paths"])
        for expected in (
            "/api/v1/requirements",
            "/api/v1/traceability/matrix",
            "/api/v1/traceability/matrix/export",
            "/api/v1/traceability/graph",
            "/api/v1/traceability/orphans",
            "/api/v1/traceability/links",
            "/api/v1/traceability/import",
            "/api/v1/traceability/rebuild",
            "/api/v1/changes",
            "/api/v1/tests",
            "/api/v1/tests/manual",
        ):
            assert expected in paths, f"missing route {expected}"
