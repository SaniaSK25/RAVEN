"""Traceability matrix builder + CSV export/import (spec section 7).

One row per (requirement, test) pair with an active ``verifies`` link;
requirements with no tests get one blank-test row; tests with no
requirement get one blank-requirement row at the end. The exported CSV
is importable by :func:`parse_import_csv` without modification
(round-trip holds).
"""

from __future__ import annotations

import csv
import io

MATRIX_COLUMNS = (
    "requirement_id",
    "requirement_version",
    "risk_id",
    "severity",
    "probability",
    "detectability",
    "rpn",
    "band",
    "assurance_level",
    "assurance_label",
    "reason_code",
    "test_id",
    "test_title",
    "test_origin",
    "coverage_status",
    "stale",
    "orphan_flags",
)

# Columns the CSV importer recognises (case-insensitive, trimmed).
REQUIREMENT_HEADERS = {
    "requirement_id",
    "req_id",
    "requirement",
    "requirement id",
    "req id",
}
TEST_HEADERS = {
    "test_id",
    "test",
    "test_case",
    "test case",
    "test_script",
    "test script",
    "test code",
}

# Display-code columns the builder emits; never formula-guard these.
_BUILDER_CODE_COLUMNS = {"test_id", "risk_id"}


def guard_cell(value: str) -> str:
    """Prepend a single quote against spreadsheet formula injection."""
    if value and value[0] in ("=", "+", "-", "@", "\t", "\r", "\n"):
        return "'" + value
    return value


def _test_display(test) -> str:
    if test.external_code:
        return test.external_code
    return f"TS-{test.id[:8]}"


def _risk_display(risk_id: str) -> str:
    return f"RSK-{risk_id[:8]}"


def build_matrix(snapshot, orphans: list | None = None) -> list[dict]:
    """Build matrix rows ordered per spec section 7.3."""
    orphans = orphans or []
    flags_by_req: dict[str, list[str]] = {}
    flags_by_test: dict[str, list[str]] = {}
    flags_by_risk: dict[str, list[str]] = {}
    for orphan in orphans:
        if orphan.type in ("O1", "O3") and orphan.entity_type == "requirement":
            flags_by_req.setdefault(orphan.entity_id, []).append(orphan.type)
        elif orphan.entity_type == "test":
            flags_by_test.setdefault(orphan.entity_id, []).append(orphan.type)
        elif orphan.entity_type == "risk":
            flags_by_risk.setdefault(orphan.entity_id, []).append(orphan.type)

    verifies = [
        link for link in snapshot.links if link.link_type == "verifies" and link.active
    ]
    tests_by_req: dict[str, list[str]] = {}
    for link in verifies:
        tests_by_req.setdefault(link.dst_id, []).append(link.src_id)
    reqs_by_test: dict[str, list[str]] = {}
    for link in verifies:
        reqs_by_test.setdefault(link.src_id, []).append(link.dst_id)

    rows: list[dict] = []
    for req in sorted(snapshot.requirements.values(), key=lambda r: r.req_key):
        test_ids = sorted(
            tests_by_req.get(req.id, []),
            key=lambda t_id: (
                _test_display(snapshot.tests[t_id]) if t_id in snapshot.tests else t_id
            ),
        )
        coverage = _coverage_status(snapshot, req.id)
        orphan_flags = ";".join(sorted(flags_by_req.get(req.id, [])))
        base = _requirement_cells(snapshot, req, coverage, orphan_flags)
        if not test_ids:
            rows.append({**base, **_blank_test_cells(req, coverage, orphan_flags)})
        for test_id in test_ids:
            test = snapshot.tests.get(test_id)
            if test is None:
                continue
            rows.append(
                {**base, **_test_cells(snapshot, req, test, coverage, orphan_flags)}
            )
    # O2 orphan test rows (tests with no requirement) come last.
    linked_test_ids = set(reqs_by_test)
    orphan_tests = [
        test
        for test_id, test in snapshot.tests.items()
        if test_id not in linked_test_ids
    ]
    for test in sorted(orphan_tests, key=_test_display):
        rows.append(_orphan_test_row(snapshot, test, flags_by_test))
    return rows


def _fresh_risk_decision(snapshot, requirement_id: str):
    """Newest (risk, assessment, decision) triple for matrix columns."""
    candidates = []
    for risk in snapshot.risks.values():
        if risk.requirement_id != requirement_id or risk.freshness == "superseded":
            continue
        for assessment in snapshot.assessments.values():
            if assessment.risk_id != risk.id or assessment.freshness == "superseded":
                continue
            for decision in snapshot.decisions.values():
                if (
                    decision.assessment_id == assessment.id
                    and decision.freshness != "superseded"
                ):
                    candidates.append((risk, assessment, decision))
    if not candidates:
        # Fall back to any non-superseded risk without a decision.
        for risk in snapshot.risks.values():
            if risk.requirement_id == requirement_id and risk.freshness != "superseded":
                return risk, None, None
        return None, None, None
    # Prefer fresh triples, then fresh risks.
    candidates.sort(
        key=lambda t: (t[0].freshness != "fresh", t[2].freshness != "fresh")
    )
    return candidates[0]


def _requirement_cells(snapshot, req, coverage: str, orphan_flags: str) -> dict:
    risk, _assessment, decision = _fresh_risk_decision(snapshot, req.id)
    return {
        "requirement_id": req.req_key,
        "requirement_version": req.version,
        "risk_id": _risk_display(risk.id) if risk else "",
        "severity": risk.severity if risk and risk.severity is not None else "",
        "probability": risk.probability
        if risk and risk.probability is not None
        else "",
        "detectability": risk.detectability
        if risk and risk.detectability is not None
        else "",
        "rpn": risk.rpn if risk and risk.rpn is not None else "",
        "band": risk.band or "" if risk else "",
        "assurance_level": decision.level if decision else "",
        "assurance_label": decision.label if decision else "",
        "reason_code": decision.reason_code if decision else "",
        "coverage_status": coverage,
        "orphan_flags": orphan_flags,
    }


def _coverage_status(snapshot, requirement_id: str) -> str:
    req = snapshot.requirements.get(requirement_id)
    if req is None or req.status != "active":
        return "uncovered"
    for link in snapshot.links:
        if (
            link.link_type == "verifies"
            and link.active
            and link.dst_id == requirement_id
        ):
            test = snapshot.tests.get(link.src_id)
            if test is not None and test.freshness == "fresh":
                return "covered_by_tests"
    for risk in snapshot.risks.values():
        if risk.requirement_id != requirement_id or risk.freshness != "fresh":
            continue
        linked = any(
            link.link_type == "has_risk"
            and link.active
            and link.src_id == requirement_id
            and link.dst_id == risk.id
            for link in snapshot.links
        )
        if not linked:
            continue
        for link in snapshot.links:
            if (
                link.link_type == "assessed_as"
                and link.active
                and link.src_id == risk.id
            ):
                decision = snapshot.decisions.get(link.dst_id)
                if (
                    decision is not None
                    and decision.freshness == "fresh"
                    and decision.level in ("exploratory", "unscripted")
                ):
                    return "covered_by_assurance"
    return "uncovered"


def _row_stale(snapshot, req, test) -> bool:
    if test.freshness == "stale":
        return True
    return req.id in snapshot.open_change_requirement_ids


def _test_cells(snapshot, req, test, coverage: str, orphan_flags: str) -> dict:
    test_flags = orphan_flags
    # Per-row orphan flags: requirement flags apply to every row of the
    # requirement; test flags attach to rows carrying that test.
    _ = coverage
    return {
        "test_id": _test_display(test),
        "test_title": test.title,
        "test_origin": test.origin,
        "stale": _row_stale(snapshot, req, test),
        "orphan_flags": test_flags,
    }


def _blank_test_cells(req, coverage: str, orphan_flags: str) -> dict:
    _ = req
    return {
        "test_id": "",
        "test_title": "",
        "test_origin": "",
        "stale": False,
        "orphan_flags": orphan_flags,
    }


def _orphan_test_row(snapshot, test, flags_by_test: dict) -> dict:
    _ = snapshot
    return {
        "requirement_id": "",
        "requirement_version": "",
        "risk_id": "",
        "severity": "",
        "probability": "",
        "detectability": "",
        "rpn": "",
        "band": "",
        "assurance_level": "",
        "assurance_label": "",
        "reason_code": "",
        "test_id": _test_display(test),
        "test_title": test.title,
        "test_origin": test.origin,
        "coverage_status": "",
        "stale": test.freshness == "stale",
        "orphan_flags": ";".join(sorted(flags_by_test.get(test.id, []))),
    }


def matrix_to_csv(rows: list[dict]) -> str:
    """Serialise rows to CSV (UTF-8, header always, injection-guarded)."""
    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer, fieldnames=list(MATRIX_COLUMNS), lineterminator="\n"
    )
    writer.writeheader()
    for row in rows:
        out: dict = {}
        for column in MATRIX_COLUMNS:
            value = row.get(column, "")
            if isinstance(value, bool):
                out[column] = "true" if value else "false"
            elif value is None:
                out[column] = ""
            elif column in _BUILDER_CODE_COLUMNS:
                out[column] = str(value)
            else:
                out[column] = guard_cell(str(value))
        writer.writerow(out)
    return buffer.getvalue()


def parse_import_csv(content: str) -> dict:
    """Parse an import CSV into normalised rows plus warnings.

    Returns ``{"rows": [{"requirement_key", "test_code", "test_title"}],
    "warnings": [...], "stats": {...}}``. Per-row problems are reported,
    never fatal.
    """
    warnings: list[str] = []
    try:
        reader = csv.DictReader(io.StringIO(content))
        if reader.fieldnames is None:
            return {
                "rows": [],
                "warnings": ["empty file: no header row"],
                "stats": {"total": 0},
            }
        normalised = {h: h.strip().lower() for h in reader.fieldnames if h}
        req_col = next(
            (h for h, n in normalised.items() if n in REQUIREMENT_HEADERS), None
        )
        test_col = next((h for h, n in normalised.items() if n in TEST_HEADERS), None)
        title_col = next(
            (
                h
                for h, n in normalised.items()
                if n in ("test_title", "test title", "title")
            ),
            None,
        )
        ignored = [
            h for h in reader.fieldnames if h not in (req_col, test_col, title_col)
        ]
        if ignored:
            warnings.append(f"ignored columns: {', '.join(ignored)}")
        if req_col is None and test_col is None:
            warnings.append("no recognised requirement/test columns in header")
            return {"rows": [], "warnings": warnings, "stats": {"total": 0}}
        rows: list[dict] = []
        for index, raw in enumerate(reader, start=2):
            req_key = (raw.get(req_col) or "").strip() if req_col else ""
            test_code = (raw.get(test_col) or "").strip() if test_col else ""
            test_title = (raw.get(title_col) or "").strip() if title_col else ""
            # Strip a guard quote the exporter may have prepended.
            if (
                test_code.startswith("'")
                and len(test_code) > 1
                and test_code[1] in ("=", "+", "-", "@")
            ):
                test_code = test_code[1:]
            if not req_key and not test_code:
                continue  # both blank -> skip silently
            rows.append(
                {
                    "line": index,
                    "requirement_key": req_key,
                    "test_code": test_code,
                    "test_title": test_title or test_code,
                }
            )
        return {"rows": rows, "warnings": warnings, "stats": {"total": len(rows)}}
    except csv.Error as exc:
        return {
            "rows": [],
            "warnings": [f"csv parse error: {exc}"],
            "stats": {"total": 0},
        }
