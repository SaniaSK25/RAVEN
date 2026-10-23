"""Requirements-level EU GMP Annex 11 coverage evaluator.

This is deliberately a gap assessment of requirement wording, not a claim
that a LIMS implementation is validated or compliant.  The deterministic
rules make the result usable without an LLM; the generated prompt can be
sent to the configured model for a second, human-reviewable opinion.
"""

from __future__ import annotations

import re
from typing import Any


ANNEX_11_RULES: tuple[dict[str, Any], ...] = (
    {
        "clause": "4.4",
        "title": "User requirements and traceability",
        "summary": "User requirements should describe required functions and remain traceable through the lifecycle.",
        "groups": (("requirement", "user requirement", "urs", "specification"), ("trace", "traceability", "lifecycle", "version")),
    },
    {
        "clause": "7",
        "title": "Data storage, backup and recovery",
        "summary": "Relevant data should be protected, accessible, readable and recoverable throughout retention.",
        "groups": (("backup", "back-up", "restore", "recovery"), ("retain", "retention", "archive", "accessible", "readable")),
    },
    {
        "clause": "9",
        "title": "Audit trails",
        "summary": "GMP-relevant changes and deletions should be recorded with a reason and be reviewable.",
        "groups": (("audit trail", "audit log", "change log", "history of changes"), ("change", "modify", "delete", "deletion"), ("reason", "justification"), ("review", "reviewed", "reviewable")),
    },
    {
        "clause": "12",
        "title": "Security and access control",
        "summary": "Access should be limited to authorised people and access creation, change and cancellation recorded.",
        "groups": (("authori", "authoriz", "access control", "role-based", "rbac", "permission"), ("user", "identity", "login", "password", "authentication"), ("access review", "access author", "create", "cancel", "disable", "deprovision")),
    },
    {
        "clause": "14",
        "title": "Electronic signatures",
        "summary": "Electronic signatures should be linked to the record and include the signer and date/time.",
        # Do not treat ordinary approvals, users, dates, or records as
        # electronic-signature evidence. The requirement must explicitly
        # describe a signature/signing control and its attribution.
        "groups": (("electronic signature", "e-signature", "esignature", "digital signature", "digitally sign"), ("signer", "signature identity", "authenticated signer"), ("signature timestamp", "signed date", "signed time", "signature linked", "linked to the record")),
    },
    {
        "clause": "16",
        "title": "Business continuity",
        "summary": "Critical processes should have documented and tested alternatives for system breakdowns.",
        "groups": (("business continuity", "disaster recovery", "contingency", "manual alternative", "fallback"), ("breakdown", "outage", "failure", "downtime"), ("test", "tested", "exercise", "documented")),
    },
)


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _matching_ids(requirements: list[dict[str, str]], groups: tuple[tuple[str, ...], ...]) -> tuple[list[str], list[str]]:
    matched: list[str] = []
    concepts: list[str] = []
    for group in groups:
        group_matches = [
            requirement["key"]
            for requirement in requirements
            if any(_normalise(term) in _normalise(requirement["text"]) for term in group)
        ]
        if group_matches:
            matched.extend(group_matches)
            concepts.append(group[0])
    return sorted(set(matched)), concepts


def evaluate_requirements(requirements: list[dict[str, str]]) -> dict[str, Any]:
    results: list[dict[str, Any]] = []
    for rule in ANNEX_11_RULES:
        matched, concepts = _matching_ids(requirements, rule["groups"])
        coverage = round(len(concepts) / len(rule["groups"]), 2)
        if coverage >= 1:
            status = "COVERED"
            explanation = "The requirement set mentions all key control concepts for this topic."
        elif coverage > 0:
            status = "PARTIALLY_COVERED"
            missing = [group[0] for group in rule["groups"] if not any(
                any(_normalise(term) in _normalise(requirement["text"]) for term in group)
                for requirement in requirements
            )]
            explanation = f"Some control concepts are present, but the requirement set does not clearly mention: {', '.join(missing)}."
        else:
            status = "ABSENT"
            explanation = "No supplied requirement clearly asks for this control."
        results.append({
            "clause": rule["clause"],
            "title": rule["title"],
            "summary": rule["summary"],
            "status": status,
            "coverage": coverage,
            "matched_requirement_keys": matched,
            "explanation": explanation,
            "named_gap": None if status == "COVERED" else f"Add or clarify a requirement covering {rule['title'].lower()}.",
        })
    counts = {status: sum(result["status"] == status for result in results) for status in ("COVERED", "PARTIALLY_COVERED", "ABSENT")}
    return {"framework": "EU GMP Annex 11", "assessment_type": "requirements_only", "results": results, "summary": counts}


def build_annex11_prompt(requirements: list[dict[str, str]]) -> str:
    rules = "\n".join(f"- Annex 11 clause {rule['clause']} — {rule['title']}: {rule['summary']}" for rule in ANNEX_11_RULES)
    supplied = "\n".join(f"{item['key']}: {item['text']}" for item in requirements)
    return f"""You are reviewing a requirements list for one LIMS system against a small, general EU GMP Annex 11 checklist.

Important limits:
- Assess only the wording of the supplied requirements.
- Do not claim that the LIMS implementation is validated or compliant.
- Do not invent evidence, tests, procedures, or capabilities.
- A requirement match means the requirement asks for a capability; it does not prove that capability exists.
- Use COVERED only when the requirement wording clearly addresses all important concepts in a rule.
- Use PARTIALLY_COVERED when the wording addresses some concepts but leaves a named gap.
- Use ABSENT when no supplied requirement addresses the rule.
- Return one result for every rule, even when no match exists.

Rules:
{rules}

Requirements:
{supplied}

Return JSON with this shape:
{{
  "results": [{{
    "clause": "9",
    "status": "COVERED | PARTIALLY_COVERED | ABSENT",
    "matched_requirement_keys": ["LIMS-001"],
    "explanation": "Short explanation based only on requirement wording.",
    "named_gap": "Required when partial or absent."
  }}]
}}
"""
