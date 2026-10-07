"""Matrix CSV importer (spec section 7.5).

Creates or reactivates ``import``-origin ``verifies`` links. Whole file
applies in one transaction; per-row problems are reported, never fatal.
System and manual links are never touched.
"""

from __future__ import annotations

import re
import uuid

_TS_CODE = re.compile(r"^TS-(.+)$", re.IGNORECASE)

# A generated prompt_version row is required by the test_scripts FK.
# Import-created tests reuse (or create) this sentinel row.
_IMPORT_PROMPT_AGENT = "traceability-import"
_IMPORT_PROMPT_VERSION = 1


def _ensure_prompt(session):
    import hashlib as _hashlib

    from app.models.prompt_version import PromptVersion

    row = (
        session.query(PromptVersion)
        .filter(PromptVersion.agent_name == _IMPORT_PROMPT_AGENT)
        .first()
    )
    if row is None:
        digest = _hashlib.sha256(b"traceability-import-v1").hexdigest()
        row = PromptVersion(
            agent_name=_IMPORT_PROMPT_AGENT,
            version=_IMPORT_PROMPT_VERSION,
            prompt="Sentinel prompt snapshot for traceability CSV imports.",
            hash=digest,
        )
        session.add(row)
        session.flush()
    return row


def apply_import(
    session, parsed: dict, mode: str = "merge", created_by: str = "system"
) -> dict:
    """Apply parsed import rows. Returns a summary with warnings."""
    from app.models.requirement import Requirement
    from app.models.test_script import TestScript
    from app.models.trace_link import TraceLink
    from app.services.traceability.sync import sync_links

    if mode not in ("merge", "replace_imported"):
        raise ValueError(f"mode must be merge|replace_imported, got {mode!r}")

    warnings = list(parsed.get("warnings", []))
    if mode == "replace_imported":
        session.query(TraceLink).filter(TraceLink.origin == "import").update(
            {"active": False}, synchronize_session=False
        )

    requirements = {r.req_key: r for r in session.query(Requirement).all() if r.req_key}
    tests_by_external = {
        t.external_code: t for t in session.query(TestScript).all() if t.external_code
    }
    tests_by_id: dict[str, object] = {
        str(t.id): t for t in session.query(TestScript).all()
    }

    links_created = links_reactivated = tests_created = 0
    requirement_only = test_unlinked = 0

    for row in parsed.get("rows", []):
        req_key, code = row["requirement_key"], row["test_code"]
        if req_key and not code:
            if req_key not in requirements:
                warnings.append(f"line {row['line']}: unknown requirement {req_key!r}")
            requirement_only += 1
            continue
        if code and (not req_key or req_key not in requirements):
            test = _resolve_test(session, tests_by_external, tests_by_id, row)
            if test is None:
                test = _create_imported_test(session, row)
                tests_created += 1
                tests_by_external[code] = test
                tests_by_id[str(test.id)] = test
            if req_key and req_key not in requirements:
                warnings.append(
                    f"line {row['line']}: unknown requirement {req_key!r}; "
                    "test left unlinked (O2)"
                )
            test_unlinked += 1
            continue
        # Both present and requirement known (active or deleted).
        requirement = requirements[req_key]
        test = _resolve_test(session, tests_by_external, tests_by_id, row)
        if test is None:
            test = _create_imported_test(session, row)
            tests_created += 1
            tests_by_external[code] = test
            tests_by_id[str(test.id)] = test
        key = ("test", str(test.id), "requirement", str(requirement.id), "verifies")
        existing = (
            session.query(TraceLink)
            .filter(
                TraceLink.src_type == "test",
                TraceLink.src_id == str(test.id),
                TraceLink.dst_type == "requirement",
                TraceLink.dst_id == str(requirement.id),
                TraceLink.link_type == "verifies",
            )
            .first()
        )
        if existing is None:
            session.add(
                TraceLink(
                    src_type="test",
                    src_id=str(test.id),
                    dst_type="requirement",
                    dst_id=str(requirement.id),
                    link_type="verifies",
                    origin="import",
                    active=True,
                    suppressed=False,
                    stale=False,
                    created_by=created_by,
                )
            )
            links_created += 1
        elif not existing.active and existing.origin == "import":
            existing.active = True
            links_reactivated += 1
        # else: an active link (any origin) already covers this pair, or an
        # inactive system/manual link we must not touch -> idempotent no-op.
        _ = key

    session.flush()
    sync_links(session, created_by=created_by)
    session.flush()
    return {
        "mode": mode,
        "links_created": links_created,
        "links_reactivated": links_reactivated,
        "tests_created": tests_created,
        "requirement_only": requirement_only,
        "test_unlinked": test_unlinked,
        "warnings": warnings,
    }


def _resolve_test(session, tests_by_external, tests_by_id, row):
    code = row["test_code"]
    if code in tests_by_external:
        return tests_by_external[code]
    match = _TS_CODE.match(code)
    if match:
        stem = match.group(1).lower()
        for test_id, test in tests_by_id.items():
            if test_id.lower().startswith(stem) or test_id.lower() == stem:
                return test
    return None


def _create_imported_test(session, row):
    from app.models.requirement_version import RequirementVersion
    from app.models.test_script import TestScript

    prompt = _ensure_prompt(session)
    versions = session.query(RequirementVersion).limit(1).all()
    if not versions:
        raise ValueError("cannot import tests: no requirement versions exist")
    test = TestScript(
        requirement_version_id=versions[0].id,
        assurance_decision_id=None,
        prompt_version_id=prompt.id,
        script=f"Imported test {row['test_code']}: {row['test_title']}",
        status="DRAFT",
        version=1,
        freshness="fresh",
        origin="imported",
        title=row["test_title"] or row["test_code"],
        external_code=row["test_code"] or None,
    )
    session.add(test)
    session.flush()
    return test


def _new_uuid() -> str:
    return str(uuid.uuid4())
