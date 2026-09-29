"""Save one analyzer run as a JSON benchmark file.

Usage (from backend/, VPN on):
    $env:BEDROCK_MODEL_ID = "us.anthropic.claude-opus-4-8"
    $env:AWS_REGION = "us-east-1"

    # Legacy level-based analysis + risk (old logic, kept for history):
    uv run python benchmarks/run_benchmark.py "The system shall ..."

    # New RAVEN evidence record + full Layer 3 assessment:
    uv run python benchmarks/run_benchmark.py --evidence "The system shall ..."

Writes: benchmarks/<slug>_<UTC-timestamp>.json
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

from app.agents.agent_analyzer import analyze_requirement, extract_evidence
from app.services.assessment import assess_evidence
from app.services.rule_engine import calculate_risk


def slugify(text: str) -> str:
    words = re.sub(r"[^a-z0-9 ]", "", text.lower()).split()[:6]
    return "-".join(words) or "requirement"


def main() -> None:
    args = sys.argv[1:]
    use_evidence = args and args[0] == "--evidence"
    if use_evidence:
        args = args[1:]
    if not args:
        print(
            'Usage: uv run python benchmarks/run_benchmark.py [--evidence] "The system shall ..."'
        )
        sys.exit(1)

    requirement = args[0]
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    out_dir = os.path.dirname(os.path.abspath(__file__))

    if use_evidence:
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
        return

    analysis = analyze_requirement(requirement)
    risk = calculate_risk(analysis)

    record = {
        "mode": "legacy",
        "requirement": requirement,
        "model_id": os.environ.get("BEDROCK_MODEL_ID"),
        "region": os.environ.get("AWS_REGION"),
        "timestamp_utc": timestamp,
        "analysis": analysis.model_dump(),
        "risk": risk,
    }

    filename = f"{slugify(requirement)}_{timestamp}.json"
    path = os.path.join(out_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    print(f"Saved benchmark: {path}")
    print(f"Risk band: {risk['risk_band']} (total {risk['total_risk_score']})")


if __name__ == "__main__":
    main()
