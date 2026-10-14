"""Loader for the configurable RPN band thresholds.

Kept separate from ``app/services/rpn.py`` so the scoring function
itself stays a pure function (no file IO). The API layer / recompute
job calls :func:`load_band_config` once at startup or per request and
passes the values into :func:`calculate_rpn`.
"""

from __future__ import annotations

from pathlib import Path

from app.services.rpn import DEFAULT_LOW_MAX, DEFAULT_MEDIUM_MAX, POINTS_MAX, POINTS_MIN

BANDS_FILE = Path(__file__).resolve().parent.parent.parent / "config" / "rules" / "bands.yaml"


def load_band_config(path: str | Path | None = None) -> dict:
    """Load ``{low_max, medium_max}`` from bands.yaml.

    Missing file or missing keys fall back to spec defaults
    (low_max=20, medium_max=50). No external dependencies: parsed
    with a minimal ``key: int`` reader so ``pyyaml`` is not required.
    """
    low_max, medium_max = DEFAULT_LOW_MAX, DEFAULT_MEDIUM_MAX
    file_path = Path(path) if path is not None else BANDS_FILE
    try:
        text = file_path.read_text(encoding="utf-8")
    except OSError:
        return {"low_max": low_max, "medium_max": medium_max}
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in stripped:
            continue
        key, _, raw = stripped.partition(":")
        key, raw = key.strip(), raw.split("#", 1)[0].strip()
        try:
            number = int(raw)
        except ValueError:
            continue
        if key == "low_max":
            low_max = number
        elif key == "medium_max":
            medium_max = number
    if not (POINTS_MIN <= low_max < medium_max <= POINTS_MAX):
        raise ValueError(
            f"Invalid band thresholds: require {POINTS_MIN} <= low_max "
            f"< medium_max <= {POINTS_MAX}, "
            f"got low_max={low_max}, medium_max={medium_max}."
        )
    return {"low_max": low_max, "medium_max": medium_max}
