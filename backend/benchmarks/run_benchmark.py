"""Save one evidence extraction + Layer 3 assessment as a JSON benchmark.

Usage (from backend/, VPN on for Bedrock):
    uv run python benchmarks/run_benchmark.py "The system shall ..."

Writes: benchmarks/<slug>_evidence_<UTC-timestamp>.json
"""

import json
import os
import re
import sys

# Same lesson as pytest: running a script puts the SCRIPT's folder on
# sys.path, not backend/. So we add backend/ explicitly, otherwise
# `import app...` fails with ModuleNotFoundError.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import UTC, datetime

from app.agents.agent_analyzer import extract_evidence
from app.services.assessment import assess_evidence


def slugify(text: str) -> str:
    words = re.sub(r"[^a-z0-9 ]", "", text.lower()).split()[:6]
    return "-".join(words) or "requirement"


def main() -> None:
    args = sys.argv[1:]
    # --evidence kept as an accepted no-op flag (evidence is the only mode).
    args = [a for a in args if a != "--evidence"]
    if not args:
        print('Usage: uv run python benchmarks/run_benchmark.py "The system shall ..."')
        sys.exit(1)

    requirement = args[0]
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    out_dir = os.path.dirname(os.path.abspath(__file__))

    usage_log: list = []
    evidence = extract_evidence(requirement, usage_log=usage_log)
    assessment = assess_evidence(evidence)
    record = {
        "mode": "evidence",
        "requirement": requirement,
        "model_id": os.environ.get("BEDROCK_MODEL_ID"),
        "region": os.environ.get("AWS_REGION"),
        "timestamp_utc": timestamp,
        "evidence": evidence.model_dump(),
        "assessment": assessment,
        "token_usage": {
            "per_call": usage_log,
            "total": {
                "input_tokens": sum(u["input_tokens"] for u in usage_log),
                "output_tokens": sum(u["output_tokens"] for u in usage_log),
                "total_tokens": sum(u["total_tokens"] for u in usage_log),
            },
        },
    }
    filename = f"{slugify(requirement)}_evidence_{timestamp}.json"
    path = os.path.join(out_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    print(f"Saved benchmark: {path}")
    print(f"GAMP category: {evidence.gamp_category}")
    print(
        f"Scores: S={assessment['severity']['score']} "
        f"P={assessment['probability']['score']} "
        f"D={assessment['detectability']['score']} "
        f"RPN={assessment['rpn']} band={assessment['band']}"
    )
    print(
        f"Assurance: {assessment['assurance']['assurance_level']} "
        f"({assessment['assurance']['rule_id']})"
    )
    print(f"Tokens: {record['token_usage']['total']}")


if __name__ == "__main__":
    main()
