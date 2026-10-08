"""RAVEN Layer 3 — recompute on rule change.

When a team leader edits a rule file (e.g. lowers ``low_max`` from 20
to 15 in ``config/rules/bands.yaml``), stored assessments must be
re-evaluated against the frozen evidence. This module implements the
pure comparison core:

1. Caller reads the frozen evidence for every active requirement
   version (no new LLM calls — outside this module).
2. :func:`recompute_one` re-runs the engines with the new ruleset.
3. The caller diffs against the stored row; identical rows are left
   untouched, differing rows get a new ``risk_assessments`` row and
   the old row is marked superseded.

Idempotent: re-running with the same ruleset yields zero diffs.
Dry-run: call :func:`recompute_many` with ``dry_run=True`` to preview
the before/after distribution without writing anything (it never
writes regardless — persistence stays in the API/DB layer).

Pure functions: no LLM, no DB, no network, no clock.
"""

from __future__ import annotations

from app.models.evidence import EvidenceRecord
from app.services.assessment import assess_evidence

_COMPARED_FIELDS = (
    "gxp_impact",
    "severity",
    "probability",
    "detectability",
    "rpn",
    "band",
)


def _freeze(result: dict) -> dict:
    """Reduce an assessment to the fields compared during recompute."""
    return {
        "gxp_impact": result["gxp_impact"],
        "severity": {
            "score": result["severity"]["score"],
            "rule_id": result["severity"]["rule_id"],
        },
        "probability": {
            "score": result["probability"]["score"],
            "rule_id": result["probability"]["rule_id"],
        },
        "detectability": {
            "score": result["detectability"]["score"],
            "rule_id": result["detectability"]["rule_id"],
        },
        "rpn": result["rpn"],
        "band": result["band"],
    }


def recompute_one(
    record: EvidenceRecord,
    stored: dict,
    low_max: int = 20,
    medium_max: int = 50,
) -> dict:
    """Re-run the engines for one record and diff against ``stored``.

    Args:
        record: frozen evidence for the requirement version.
        stored: frozen ``_freeze(assess_evidence(...))`` snapshot of the
            currently stored row.
        low_max / medium_max: the NEW band thresholds to apply.

    Returns:
        ``{"changed": bool, "new": dict, "diff": dict}`` where ``new``
        is the full fresh assessment and ``diff`` maps each changed
        field to ``{"before": ..., "after": ...}`` (empty when
        unchanged).
    """
    fresh = assess_evidence(record, low_max=low_max, medium_max=medium_max)
    new_frozen, old_frozen = _freeze(fresh), _freeze(stored)
    diff: dict = {}
    for field in _COMPARED_FIELDS:
        if new_frozen[field] != old_frozen.get(field):
            diff[field] = {"before": old_frozen.get(field), "after": new_frozen[field]}
    return {"changed": bool(diff), "new": fresh, "diff": diff}


def recompute_many(
    items: list[tuple[EvidenceRecord, dict]],
    low_max: int = 20,
    medium_max: int = 50,
    dry_run: bool = True,
) -> dict:
    """Recompute a batch; report distribution without persisting.

    Returns ``{"total", "changed", "unchanged", "changes": [...],
    "band_distribution": {"before": {...}, "after": {...}}}``.
    ``dry_run`` is accepted for API symmetry (this function never
    writes) so callers can log intent explicitly.
    """
    _ = dry_run
    changes: list[dict] = []
    before_bands: dict[str, int] = {}
    after_bands: dict[str, int] = {}
    for index, (record, stored) in enumerate(items):
        outcome = recompute_one(record, stored, low_max=low_max, medium_max=medium_max)
        before = stored.get("band")
        after = outcome["new"]["band"]
        before_bands[before] = before_bands.get(before, 0) + 1
        after_bands[after] = after_bands.get(after, 0) + 1
        if outcome["changed"]:
            changes.append({"index": index, "diff": outcome["diff"]})
    return {
        "total": len(items),
        "changed": len(changes),
        "unchanged": len(items) - len(changes),
        "changes": changes,
        "band_distribution": {"before": before_bands, "after": after_bands},
    }
