"""Analyze stored requirements you select (all pending or named REQ-numbers).

Step 1 (import script) stores rows with zero LLM calls. This script runs
the pipeline later, only on your selection: extract, assess, gate,
optionally script, persist — one transaction per requirement.

Usage (from backend/):
    uv run python scripts/analyze_requirements.py            # interactive pick
    uv run python scripts/analyze_requirements.py --all-pending
    uv run python scripts/analyze_requirements.py REQ-0001 REQ-0003
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.agent_analyzer import extract_evidence
from app.agents.agent_script_writer import generate_test_script
from app.db.session import SessionLocal
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.services.pipeline import run_full_analysis


def list_pending(session) -> list:
    """Stored current versions with no current assessment, ordered by key."""
    rows = (
        session.query(Requirement.req_key, Requirement.title, RequirementVersion.id)
        .join(
            RequirementVersion,
            RequirementVersion.requirement_id == Requirement.id,
        )
        .outerjoin(
            RiskAssessment,
            (RiskAssessment.requirement_version_id == RequirementVersion.id)
            & (RiskAssessment.is_current == True),
        )
        .filter(
            RequirementVersion.is_current == True,
            RiskAssessment.id.is_(None),
        )
        .order_by(Requirement.req_key)
        .all()
    )
    return [
        {"req_key": key, "title": title, "version_id": version_id}
        for key, title, version_id in rows
    ]


def parse_selection(answer: str, pending_keys: list) -> list:
    """Resolve interactive input to an ordered key list. Raises ValueError."""
    cleaned = answer.strip().upper()
    if cleaned in ("A", "ALL"):
        return list(pending_keys)
    if not cleaned:
        raise ValueError("Empty selection.")
    chosen = [k.strip().upper() for k in cleaned.split(",") if k.strip()]
    unknown = [k for k in chosen if k not in pending_keys]
    if unknown:
        raise ValueError(f"Unknown keys (not pending): {', '.join(unknown)}.")
    seen, ordered = set(), []
    for key in chosen:
        if key not in seen:
            seen.add(key)
            ordered.append(key)
    return ordered


def analyze_version(session, version_id, extract_fn, script_fn) -> dict:
    """Run pipeline + persist for one stored version. Commits."""
    version = session.get(RequirementVersion, version_id)
    if version is None:
        raise ValueError(f"Unknown requirement version: {version_id}.")
    result = run_full_analysis(session, version, version.text, extract_fn, script_fn)
    session.commit()
    assessment = result["assessment"]
    return {
        "band": assessment["band"],
        "level": assessment["assurance"]["assurance_level"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze selected requirements.")
    parser.add_argument("keys", nargs="*", help="REQ-numbers to analyze.")
    parser.add_argument(
        "--all-pending",
        action="store_true",
        help="Analyze every pending requirement without prompting.",
    )
    args = parser.parse_args()

    session = SessionLocal()
    try:
        pending = list_pending(session)
        if not pending:
            print("Nothing pending: every stored requirement is assessed.")
            return 0
        keys = [p["req_key"] for p in pending]

        if args.all_pending:
            selected = keys
        elif args.keys:
            selected = parse_selection(",".join(args.keys), keys)
        elif not sys.stdin.isatty():
            print("Not interactive: pass --all-pending or REQ-numbers.")
            return 2
        else:
            print(f"{len(pending)} requirements pending assessment:")
            for item in pending:
                print(f"  {item['req_key']} | {item['title'][:70]}")
            while True:
                try:
                    answer = input(
                        "[A]ll, comma list (REQ-0001, REQ-0003), or [Q]uit > "
                    )
                except (EOFError, KeyboardInterrupt):
                    print("\nAborted.")
                    return 1
                if answer.strip().upper() in ("Q", "QUIT"):
                    print("Aborted.")
                    return 1
                try:
                    selected = parse_selection(answer, keys)
                except ValueError as exc:
                    print(f"  {exc} Try again.")
                    continue
                break

        by_key = {p["req_key"]: p for p in pending}
        done, failed = [], []
        for i, key in enumerate(selected, start=1):
            try:
                summary = analyze_version(
                    session,
                    by_key[key]["version_id"],
                    extract_evidence,
                    generate_test_script,
                )
            except Exception as exc:  # noqa: BLE001 (per-row isolation)
                session.rollback()
                failed.append((key, str(exc)[:120]))
                continue
            done.append(key)
            print(
                f"[{i}/{len(selected)}] {key} … {summary['level']}, band {summary['band']}"
            )
        print(f"assessed={len(done)} failed={len(failed)}")
        for key, detail in failed:
            print(f"  {key}: {detail}")
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main())
