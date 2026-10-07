"""Re-analysis diff (spec section 6.2/6.3). Pure function.

``material_change`` is true if and only if the band or the assurance
level changed. A change in raw S/P/D scores that keeps the same band
and level is non-material.
"""

from __future__ import annotations

DIFF_FIELDS = (
    "severity",
    "probability",
    "detectability",
    "rpn",
    "band",
    "gxp_impact",
    "gamp_category",
    "level",
    "reason_code",
)


def compute_diff(before: dict | None, after: dict) -> dict:
    """Build the stored diff between baseline and re-analysis."""
    before = dict(before or {})
    after = dict(after or {})
    changed_fields = sorted(
        field for field in DIFF_FIELDS if before.get(field) != after.get(field)
    )
    if before:
        material_change = before.get("band") != after.get("band") or before.get(
            "level"
        ) != after.get("level")
    else:
        # New analysis from scratch always counts as material.
        material_change = True
    return {
        "before": {field: before.get(field) for field in DIFF_FIELDS},
        "after": {field: after.get(field) for field in DIFF_FIELDS},
        "changed_fields": changed_fields,
        "material_change": material_change,
    }


def is_material_change(diff: dict) -> bool:
    return bool(diff.get("material_change"))
