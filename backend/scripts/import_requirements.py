"""Import requirements from CSV or JSON and store them (no LLM by default).

Each input is one requirement sentence (IDs are UUIDs; human keys are
REQ-numbers assigned automatically). Storing never calls the LLM:
parse, dedupe by SHA-256, insert Requirement + RequirementVersion rows.
Pass --with-analysis to also run the full pipeline per row (extract,
assess, gate, script, persist). Duplicate text is skipped silently
and counted.

Usage (from backend/):
    uv run python scripts/import_requirements.py requirements.csv
    uv run python scripts/import_requirements.py requirements.json --dry-run
    uv run python scripts/import_requirements.py requirements.csv --with-analysis

CSV: header row with a `text` column (extra columns ignored).
JSON: array of strings, or array of {"text": ...} objects.
"""

import argparse
import csv
import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.agent_analyzer import extract_evidence
from app.agents.agent_script_writer import generate_test_script
from app.db.session import SessionLocal
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.services.numbering import next_req_key
from app.services.pipeline import PROMPTS, run_full_analysis


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def parse_csv(path: str) -> list:
    """Return [(line_number, text or None if invalid)]."""
    rows = []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if "text" not in (reader.fieldnames or []):
            raise ValueError("CSV must have a 'text' column header.")
        for i, row in enumerate(reader, start=2):
            text = (row.get("text") or "").strip()
            rows.append((i, text or None))
    return rows


def parse_json(path: str) -> list:
    """Return [(index, text or None if invalid)]."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise TypeError('JSON must be an array of strings or {"text": ...} objects.')
    rows = []
    for i, item in enumerate(data, start=1):
        if isinstance(item, str):
            text = item.strip()
        elif isinstance(item, dict):
            text = str(item.get("text") or "").strip()
        else:
            text = ""
        rows.append((i, text or None))
    return rows


def import_sentence(
    session,
    text: str,
    extract_fn=extract_evidence,
    script_fn=generate_test_script,
    run_pipeline: bool = False,
) -> dict:
    """Store one sentence; optionally run the full pipeline. One transaction.

    Storing never calls the LLM. Pipeline (extract, assess, gate, script,
    persist) runs only with run_pipeline=True.
    """
    digest = _sha(text)
    existing = session.query(RequirementVersion).filter_by(hash_sha256=digest).first()
    if existing is not None:
        return {"status": "skipped", "reason": "duplicate text"}

    requirement = Requirement(
        req_key=next_req_key(session),
        title=text[:100],
        description=text,
        created_by="import",
    )
    session.add(requirement)
    session.flush()
    version = RequirementVersion(
        requirement_id=requirement.id,
        version_number=1,
        text=text,
        hash_sha256=digest,
        is_current=True,
    )
    session.add(version)
    session.flush()

    if run_pipeline:
        run_full_analysis(session, version, text, extract_fn, script_fn, PROMPTS)
    requirement.current_version_id = version.id
    session.commit()
    return {"status": "imported", "req_key": requirement.req_key}


def main() -> int:
    parser = argparse.ArgumentParser(description="Import requirements from CSV/JSON.")
    parser.add_argument("path", help="CSV or JSON file to import.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate format and report duplicates without writing or LLM calls.",
    )
    parser.add_argument(
        "--with-analysis",
        action="store_true",
        help="Also run the full pipeline per row (LLM calls, costs tokens).",
    )
    args = parser.parse_args()

    if args.path.lower().endswith(".csv"):
        rows = parse_csv(args.path)
    elif args.path.lower().endswith(".json"):
        rows = parse_json(args.path)
    else:
        print("File must end in .csv or .json.")
        return 2

    imported, skipped, failed = [], [], []
    session = SessionLocal()
    try:
        for lineno, text in rows:
            if text is None:
                failed.append((lineno, "empty or missing text"))
                continue
            if args.dry_run:
                dup = (
                    session.query(RequirementVersion)
                    .filter_by(hash_sha256=_sha(text))
                    .first()
                )
                (skipped if dup else imported).append((lineno, text[:60]))
                continue
            try:
                result = import_sentence(session, text, run_pipeline=args.with_analysis)
            except Exception as exc:  # noqa: BLE001 (per-row isolation)
                session.rollback()
                failed.append((lineno, str(exc)))
                continue
            if result["status"] == "imported":
                imported.append((lineno, result["req_key"]))
            else:
                skipped.append((lineno, result["reason"]))
    finally:
        session.close()

    print(f"imported={len(imported)} skipped={len(skipped)} failed={len(failed)}")
    for lineno, detail in failed:
        print(f"  row {lineno}: {detail}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
