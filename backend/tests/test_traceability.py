"""Layer 6 pure-module tests (TRACEABILITY MATRIX spec, section 9.1).

No database, no LLM. Fixture builders construct :class:`TraceSnapshot`
directly; each test class covers one pure module.
"""

from app.services.traceability.changediff import compute_diff
from app.services.traceability.changeflow import (
    InvalidStateError,
    check_transition,
    union_impacts,
)
from app.services.traceability.derivation import derive_links
from app.services.traceability.graph import build_graph
from app.services.traceability.impact import compute_impact
from app.services.traceability.matrix import (
    MATRIX_COLUMNS,
    build_matrix,
    guard_cell,
    matrix_to_csv,
    parse_import_csv,
)
from app.services.traceability.orphans import find_orphans, orphan_summary
from app.services.traceability.snapshot import (
    AssessmentInfo,
    DecisionInfo,
    LinkInfo,
    RequirementInfo,
    RiskInfo,
    TestInfo,
    TraceSnapshot,
)
from app.services.traceability.stale import link_stale

# --------------------------------------------------------------------------
# Fixture builders
# --------------------------------------------------------------------------


def make_req(rid="R1", key="LIMS-001", status="active", version=1):
    return RequirementInfo(id=rid, req_key=key, version=version, status=status)


def make_risk(
    rid="K1",
    req="R1",
    freshness="fresh",
    current=True,
    severity=4,
    probability=3,
    detectability=4,
    rpn=48,
    band="Medium",
):
    return RiskInfo(
        id=rid,
        requirement_id=req,
        requirement_version_id="V1",
        freshness=freshness,
        is_current_version=current,
        severity=severity,
        probability=probability,
        detectability=detectability,
        rpn=rpn,
        band=band,
    )


def make_assessment(aid="A1", risk="K1", freshness="fresh"):
    return AssessmentInfo(id=aid, risk_id=risk, freshness=freshness)


def make_decision(
    did="D1",
    assessment="A1",
    risk="K1",
    freshness="fresh",
    level="scripted",
    reason="ASR-SEV-FLOOR",
):
    return DecisionInfo(
        id=did,
        assessment_id=assessment,
        risk_id=risk,
        freshness=freshness,
        level=level,
        reason_code=reason,
        label=level,
        method="",
    )


def make_test(
    tid="T1",
    origin="generated",
    freshness="fresh",
    risk="K1",
    title="Title",
    external=None,
):
    return TestInfo(
        id=tid,
        origin=origin,
        freshness=freshness,
        title=title,
        external_code=external,
        risk_id=risk,
    )


def make_link(
    lid,
    src_type,
    src_id,
    dst_type,
    dst_id,
    link_type,
    active=True,
    suppressed=False,
    stale=False,
    origin="system",
):
    return LinkInfo(
        id=lid,
        src_type=src_type,
        src_id=src_id,
        dst_type=dst_type,
        dst_id=dst_id,
        link_type=link_type,
        origin=origin,
        active=active,
        suppressed=suppressed,
        stale=stale,
    )


def scripted_snapshot():
    """Healthy scripted requirement with two generated scripts."""
    snap = TraceSnapshot(
        requirements={"R1": make_req()},
        risks={"K1": make_risk()},
        assessments={"A1": make_assessment()},
        decisions={"D1": make_decision()},
        tests={
            "T1": make_test("T1", external="TC-101"),
            "T2": make_test("T2", external="TC-102"),
        },
    )
    snap.links = [
        make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
        make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
        make_link("L3", "assurance", "D1", "test", "T1", "mitigated_by"),
        make_link("L4", "assurance", "D1", "test", "T2", "mitigated_by"),
        make_link("L5", "test", "T1", "requirement", "R1", "verifies"),
        make_link("L6", "test", "T2", "requirement", "R1", "verifies"),
    ]
    return snap


# --------------------------------------------------------------------------
# Link derivation
# --------------------------------------------------------------------------


class TestDerivation:
    def test_d1_superseded_risks_produce_no_has_risk(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk(freshness="superseded")},
        )
        assert [l for l in derive_links(snap) if l.link_type == "has_risk"] == []

    def test_d2_superseded_assessments_produce_no_assessed_as(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment(freshness="superseded")},
            decisions={"D1": make_decision()},
        )
        assert [l for l in derive_links(snap) if l.link_type == "assessed_as"] == []

    def test_d2_superseded_decisions_produce_no_assessed_as(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision(freshness="superseded")},
        )
        assert [l for l in derive_links(snap) if l.link_type == "assessed_as"] == []

    def test_d3_superseded_manual_imported_scripts_produce_no_mitigated_by(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision()},
            tests={
                "T1": make_test("T1", freshness="superseded"),
                "T2": make_test("T2", origin="manual"),
                "T3": make_test("T3", origin="imported"),
            },
        )
        assert [l for l in derive_links(snap) if l.link_type == "mitigated_by"] == []

    def test_d4_superseded_manual_imported_scripts_produce_no_verifies(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision()},
            tests={
                "T1": make_test("T1", freshness="superseded"),
                "T2": make_test("T2", origin="manual"),
                "T3": make_test("T3", origin="imported"),
            },
        )
        assert [l for l in derive_links(snap) if l.link_type == "verifies"] == []

    def test_stale_risk_still_derives_links_but_marks_them_stale(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk(freshness="stale")},
            assessments={"A1": make_assessment(freshness="stale")},
            decisions={"D1": make_decision(freshness="stale")},
            tests={"T1": make_test("T1", freshness="stale")},
        )
        assert len(derive_links(snap)) == 4  # stale != superseded: still derived
        assert link_stale("stale", "fresh") is True
        assert link_stale("fresh", "stale") is True
        assert link_stale("fresh", "fresh") is False
        assert link_stale(None, "fresh") is False

    def test_determinism_100_repeated_calls_identical(self):
        snap = scripted_snapshot()
        first = derive_links(snap)
        for _ in range(100):
            assert derive_links(snap) == first


# --------------------------------------------------------------------------
# Orphan detection
# --------------------------------------------------------------------------


class TestOrphans:
    def test_healthy_set_has_zero_orphans(self):
        assert find_orphans(scripted_snapshot()) == []

    def test_o1_scripted_no_tests(self):
        snap = scripted_snapshot()
        snap.links = [l for l in snap.links if l.link_type != "verifies"]
        snap.tests = {}
        orphans = find_orphans(snap)
        assert [(o.type, o.reason) for o in orphans] == [("O1", "scripted_no_tests")]

    def test_o1_no_assurance(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            links=[make_link("L1", "requirement", "R1", "risk", "K1", "has_risk")],
        )
        orphans = find_orphans(snap)
        by_type = {o.type: o for o in orphans}
        assert by_type["O1"].reason == "no_assurance"

    def test_o1_stale_only(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk(freshness="stale")},
            links=[make_link("L1", "requirement", "R1", "risk", "K1", "has_risk")],
        )
        orphans = find_orphans(snap)
        assert [(o.type, o.reason) for o in orphans] == [("O1", "stale_only")]

    def test_o1_not_analyzed(self):
        snap = TraceSnapshot(requirements={"R1": make_req()})
        orphans = find_orphans(snap)
        assert [(o.type, o.reason) for o in orphans] == [("O1", "not_analyzed")]

    def test_o1_supplier_leverage_is_not_an_orphan(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision(level="unscripted", reason="ASR-SUPPLIER")},
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
            ],
        )
        assert find_orphans(snap) == []

    def test_o1_exploratory_is_not_an_orphan(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={
                "D1": make_decision(level="exploratory", reason="ASR-BAND-MEDIUM")
            },
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
            ],
        )
        assert find_orphans(snap) == []

    def test_o2_no_links(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            tests={"T9": make_test("T9", origin="manual", risk=None)},
        )
        orphans = find_orphans(snap)
        o2 = [o for o in orphans if o.type == "O2"]
        assert len(o2) == 1 and o2[0].reason == "no_links"

    def test_o2_requirement_deleted(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req(status="deleted")},
            tests={"T9": make_test("T9", origin="manual", risk=None)},
            links=[
                make_link(
                    "L9", "test", "T9", "requirement", "R1", "verifies", origin="manual"
                )
            ],
        )
        o2 = [o for o in find_orphans(snap) if o.type == "O2"]
        assert len(o2) == 1 and o2[0].reason == "requirement_deleted"

    def test_o2_not_triggered_with_one_active_and_one_deleted(self):
        snap = TraceSnapshot(
            requirements={
                "R1": make_req(),
                "R2": make_req(rid="R2", key="LIMS-002", status="deleted"),
            },
            tests={"T9": make_test("T9", origin="manual", risk=None)},
            links=[
                make_link(
                    "L8", "test", "T9", "requirement", "R1", "verifies", origin="manual"
                ),
                make_link(
                    "L9", "test", "T9", "requirement", "R2", "verifies", origin="manual"
                ),
            ],
        )
        assert [o for o in find_orphans(snap) if o.type == "O2"] == []

    def test_o3_fresh_risk_with_no_assessed_as(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            links=[make_link("L1", "requirement", "R1", "risk", "K1", "has_risk")],
        )
        assert any(o.type == "O3" for o in find_orphans(snap))

    def test_double_report_o1_and_o3(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            links=[make_link("L1", "requirement", "R1", "risk", "K1", "has_risk")],
        )
        types = sorted(o.type for o in find_orphans(snap))
        assert types == ["O1", "O3"]

    def test_output_ordering_by_type_then_key(self):
        snap = TraceSnapshot(
            requirements={
                "R2": make_req(rid="R2", key="LIMS-002"),
                "R1": make_req(key="LIMS-001"),
            },
            tests={"T9": make_test("T9", origin="manual", risk=None)},
        )
        ordered = [(o.type, o.entity_key) for o in find_orphans(snap)]
        assert ordered == sorted(ordered)
        assert [t for t, _ in ordered] == ["O1", "O1", "O2"]

    def test_orphan_summary_counts(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            links=[make_link("L1", "requirement", "R1", "risk", "K1", "has_risk")],
        )
        summary = orphan_summary(find_orphans(snap))
        assert summary == {"O1": 1, "O2": 0, "O3": 1, "total": 2}


# --------------------------------------------------------------------------
# Impact computation
# --------------------------------------------------------------------------


class TestImpact:
    def test_scripted_with_two_scripts_impacts_everything(self):
        impact = compute_impact(scripted_snapshot(), "R1", "edit")
        assert list(impact.risks) == ["K1"]
        assert list(impact.assessments) == ["A1"]
        assert list(impact.decisions) == ["D1"]
        assert list(impact.tests) == ["T1", "T2"]
        assert list(impact.links) == ["L1", "L2", "L3", "L4", "L5", "L6"]

    def test_exploratory_has_no_tests_in_impact(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={
                "D1": make_decision(level="exploratory", reason="ASR-BAND-MEDIUM")
            },
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
            ],
        )
        impact = compute_impact(snap, "R1", "edit")
        assert list(impact.tests) == []
        assert list(impact.links) == ["L1", "L2"]

    def test_supplier_leverage_has_no_tests_in_impact(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision(level="unscripted", reason="ASR-SUPPLIER")},
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
            ],
        )
        impact = compute_impact(snap, "R1", "edit")
        assert list(impact.tests) == []
        assert list(impact.risks) == ["K1"]

    def test_unanalysed_requirement_empty_impact(self):
        snap = TraceSnapshot(requirements={"R1": make_req()})
        assert compute_impact(snap, "R1", "edit").to_dict() == {
            "risks": [],
            "assessments": [],
            "decisions": [],
            "tests": [],
            "links": [],
        }

    def test_manual_test_shared_across_two_requirements(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req(), "R2": make_req(rid="R2", key="LIMS-002")},
            tests={"M1": make_test("M1", origin="manual", risk=None, title="Manual")},
            links=[
                make_link(
                    "L1", "test", "M1", "requirement", "R1", "verifies", origin="manual"
                ),
                make_link(
                    "L2", "test", "M1", "requirement", "R2", "verifies", origin="manual"
                ),
            ],
        )
        assert list(compute_impact(snap, "R1", "edit").tests) == ["M1"]
        assert list(compute_impact(snap, "R2", "edit").tests) == ["M1"]

    def test_already_stale_items_not_relisted(self):
        snap = scripted_snapshot()
        snap.tests["T1"] = make_test("T1", freshness="stale", external="TC-101")
        impact = compute_impact(snap, "R1", "edit")
        assert list(impact.tests) == ["T2"]

    def test_union_with_prior_open_events(self):
        snap = scripted_snapshot()
        prior = {
            "risks": ["K0"],
            "assessments": [],
            "decisions": [],
            "tests": ["T0"],
            "links": ["L0"],
        }
        impact = compute_impact(snap, "R1", "edit", prior_open_events=[prior])
        assert "K0" in impact.risks and "K1" in impact.risks
        assert "T0" in impact.tests and "T1" in impact.tests

    def test_union_impacts_helper(self):
        merged = union_impacts(
            {
                "risks": ["K1"],
                "assessments": [],
                "decisions": [],
                "tests": [],
                "links": [],
            },
            {
                "risks": ["K2"],
                "assessments": [],
                "decisions": [],
                "tests": [],
                "links": [],
            },
        )
        assert merged["risks"] == ["K1", "K2"]


# --------------------------------------------------------------------------
# Diff
# --------------------------------------------------------------------------


def _assessment(band="Medium", level="exploratory"):
    return {
        "severity": 4,
        "probability": 3,
        "detectability": 4,
        "rpn": 48,
        "band": band,
        "gxp_impact": True,
        "gamp_category": 4,
        "level": level,
        "reason_code": "ASR-BAND-MEDIUM",
    }


class TestDiff:
    def test_material_when_band_changes(self):
        diff = compute_diff(_assessment(band="Medium"), _assessment(band="High"))
        assert diff["material_change"] is True
        assert "band" in diff["changed_fields"]

    def test_material_when_level_changes(self):
        diff = compute_diff(
            _assessment(level="exploratory"), _assessment(level="scripted")
        )
        assert diff["material_change"] is True

    def test_not_material_when_only_scores_change(self):
        before = _assessment()
        after = dict(before, severity=3, probability=2)
        diff = compute_diff(before, after)
        assert diff["material_change"] is False
        assert diff["changed_fields"] == ["probability", "severity"]

    def test_material_when_before_is_none(self):
        diff = compute_diff(None, _assessment())
        assert diff["material_change"] is True

    def test_changed_fields_sorted_alphabetically(self):
        before = _assessment(band="Low", level="unscripted")
        after = _assessment(band="High", level="scripted")
        assert compute_diff(before, after)["changed_fields"] == sorted(
            compute_diff(before, after)["changed_fields"]
        )

    def test_state_machine_rejects_invalid_transitions(self):
        check_transition("open", "reanalyzed")
        check_transition("reanalyzed", "confirmed")
        for bad in [
            ("open", "confirmed"),
            ("confirmed", "accepted"),
            ("accepted", "open"),
            ("superseded", "open"),
        ]:
            try:
                check_transition(*bad)
            except InvalidStateError:
                pass
            else:
                raise AssertionError(f"{bad} should be invalid")


# --------------------------------------------------------------------------
# Matrix builder
# --------------------------------------------------------------------------


class TestMatrix:
    def test_covered_requirement_one_row_all_fields(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision()},
            tests={"T1": make_test("T1", external="TC-101")},
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
                make_link("L5", "test", "T1", "requirement", "R1", "verifies"),
            ],
        )
        rows = build_matrix(snap, find_orphans(snap))
        assert len(rows) == 1
        row = rows[0]
        assert row["requirement_id"] == "LIMS-001"
        assert row["requirement_version"] == 1
        assert row["severity"] == 4 and row["rpn"] == 48
        assert row["assurance_level"] == "scripted"
        assert row["test_id"] == "TC-101"
        assert row["coverage_status"] == "covered_by_tests"
        assert row["stale"] is False

    def test_covered_requirement_two_tests_two_rows(self):
        rows = build_matrix(scripted_snapshot(), [])
        assert len(rows) == 2
        assert [r["test_id"] for r in rows] == ["TC-101", "TC-102"]

    def test_uncovered_requirement_blank_test_fields(self):
        snap = TraceSnapshot(requirements={"R1": make_req()})
        rows = build_matrix(snap, find_orphans(snap))
        assert len(rows) == 1
        assert rows[0]["test_id"] == "" and rows[0]["test_title"] == ""
        assert rows[0]["coverage_status"] == "uncovered"
        assert rows[0]["orphan_flags"] == "O1"

    def test_supplier_leverage_covered_by_assurance(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision(level="unscripted", reason="ASR-SUPPLIER")},
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L2", "risk", "K1", "assurance", "D1", "assessed_as"),
            ],
        )
        rows = build_matrix(snap, find_orphans(snap))
        assert len(rows) == 1
        assert rows[0]["test_id"] == ""
        assert rows[0]["coverage_status"] == "covered_by_assurance"

    def test_o2_orphan_test_blank_requirement_fields_at_end(self):
        snap = scripted_snapshot()
        snap.tests["T9"] = make_test("T9", origin="manual", risk=None, title="Loose")
        rows = build_matrix(snap, find_orphans(snap))
        assert rows[-1]["requirement_id"] == ""
        assert rows[-1]["test_title"] == "Loose"
        assert rows[-1]["orphan_flags"] == "O2"

    def test_row_ordering_requirements_alpha_tests_by_code(self):
        snap = TraceSnapshot(
            requirements={
                "R2": make_req(rid="R2", key="LIMS-010"),
                "R1": make_req(key="LIMS-002"),
            },
            tests={
                "T1": make_test(
                    "T1", origin="manual", risk=None, title="A", external="TC-002"
                )
            },
            links=[
                make_link(
                    "L1", "test", "T1", "requirement", "R2", "verifies", origin="manual"
                )
            ],
        )
        rows = build_matrix(snap, [])
        assert [r["requirement_id"] for r in rows] == ["LIMS-002", "LIMS-010"]
        assert rows[0]["test_id"] == ""  # LIMS-002 has no tests
        assert rows[1]["test_id"] == "TC-002"

    def test_csv_injection_guard_prepends_quote(self):
        assert guard_cell("=cmd|evil") == "'=cmd|evil"
        assert guard_cell("+1+1") == "'+1+1"
        assert guard_cell("-2+3") == "'-2+3"
        assert guard_cell("@mention") == "'@mention"
        assert guard_cell("plain") == "plain"

    def test_matrix_csv_test_id_not_guarded(self):
        snap = TraceSnapshot(
            requirements={"R1": make_req()},
            risks={"K1": make_risk()},
            assessments={"A1": make_assessment()},
            decisions={"D1": make_decision()},
            tests={"T1": make_test("T1", external="TC-101", title="=evil")},
            links=[
                make_link("L1", "requirement", "R1", "risk", "K1", "has_risk"),
                make_link("L5", "test", "T1", "requirement", "R1", "verifies"),
            ],
        )
        csv_text = matrix_to_csv(build_matrix(snap, []))
        header, body = csv_text.splitlines()
        assert header.split(",")[0] == "requirement_id"
        assert list(MATRIX_COLUMNS) == header.split(",")
        assert ",TC-101," in body  # code column untouched
        assert "'=evil" in body  # title column guarded

    def test_round_trip_export_import_unchanged(self):
        rows = build_matrix(scripted_snapshot(), [])
        parsed = parse_import_csv(matrix_to_csv(rows))
        exported_pairs = {
            (r["requirement_id"], r["test_id"])
            for r in rows
            if r["requirement_id"] and r["test_id"]
        }
        parsed_pairs = {(r["requirement_key"], r["test_code"]) for r in parsed["rows"]}
        assert parsed_pairs == exported_pairs

    def test_import_parser_recognises_alias_headers_and_ignores_risk_cols(self):
        content = (
            "Requirement ID,Test Case,RPN,Band\n"
            "LIMS-001,TC-101,48,Medium\n"
            ",\n"
            "LIMS-002,,\n"
        )
        parsed = parse_import_csv(content)
        assert len(parsed["rows"]) == 2
        assert any("ignored columns" in w for w in parsed["warnings"])
        assert parsed["rows"][1]["test_code"] == ""


# --------------------------------------------------------------------------
# Graph builder
# --------------------------------------------------------------------------


class TestGraph:
    def test_node_id_format(self):
        graph = build_graph(scripted_snapshot(), [])
        ids = {n["id"] for n in graph["nodes"]}
        assert "requirement:R1" in ids and "risk:K1" in ids
        assert "assurance:D1" in ids and "test:T1" in ids

    def test_stale_node_flag(self):
        snap = scripted_snapshot()
        snap.risks["K1"] = make_risk(freshness="stale")
        graph = build_graph(snap, [])
        assert next(n for n in graph["nodes"] if n["id"] == "risk:K1")["stale"] is True

    def test_orphan_node_flag(self):
        snap = TraceSnapshot(requirements={"R1": make_req()})
        graph = build_graph(snap, find_orphans(snap))
        assert (
            next(n for n in graph["nodes"] if n["id"] == "requirement:R1")["orphan"]
            is True
        )

    def test_focus_mode_returns_only_connected_component(self):
        snap = scripted_snapshot()
        snap.requirements["R2"] = make_req(rid="R2", key="LIMS-002")
        graph = build_graph(snap, [], requirement_key="LIMS-002")
        assert [n["id"] for n in graph["nodes"]] == ["requirement:R2"]
        assert graph["edges"] == []

    def test_suppressed_edges_excluded_unless_include_inactive(self):
        snap = scripted_snapshot()
        snap.links.append(
            make_link(
                "L9",
                "test",
                "T1",
                "requirement",
                "R1",
                "verifies",
                active=False,
                suppressed=True,
            )
        )
        default = build_graph(snap, [])
        assert "link:L9" not in {e["id"] for e in default["edges"]}
        with_inactive = build_graph(snap, [], include_inactive=True)
        assert "link:L9" in {e["id"] for e in with_inactive["edges"]}

    def test_ordering_nodes_and_edges_sorted(self):
        graph = build_graph(scripted_snapshot(), [])
        assert [n["id"] for n in graph["nodes"]] == sorted(
            n["id"] for n in graph["nodes"]
        )
        assert [e["id"] for e in graph["edges"]] == sorted(
            e["id"] for e in graph["edges"]
        )
        assert set(graph["summary"]) == {
            "nodes",
            "edges",
            "stale_nodes",
            "stale_edges",
            "orphan_nodes",
        }
