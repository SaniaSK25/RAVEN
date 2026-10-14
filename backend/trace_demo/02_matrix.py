"""Demo step 2: print the traceability matrix + export the CSV.

Usage:  .venv/Scripts/python.exe trace_demo/02_matrix.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from trace_demo.common import HERE, get_session  # noqa: E402

from app.services.traceability.io import snapshot_from_db  # noqa: E402
from app.services.traceability.matrix import (  # noqa: E402
    MATRIX_COLUMNS,
    build_matrix,
    matrix_to_csv,
)
from app.services.traceability.orphans import find_orphans  # noqa: E402

session = get_session()
snapshot = snapshot_from_db(session)
rows = build_matrix(snapshot, find_orphans(snapshot))

SHOW = (
    "requirement_id", "risk_id", "severity", "rpn", "band",
    "assurance_level", "test_id", "test_origin", "coverage_status",
    "stale", "orphan_flags",
)
widths = {c: max(len(c), *(len(str(r[c])) for r in rows)) for c in SHOW}
header = " | ".join(c.ljust(widths[c]) for c in SHOW)
print(header)
print("-" * len(header))
for r in rows:
    print(" | ".join(str(r[c]).ljust(widths[c]) for c in SHOW))
print(f"\n{len(rows)} rows x {len(MATRIX_COLUMNS)} columns")

csv_path = HERE / "matrix_export.csv"
csv_path.write_text(matrix_to_csv(rows), encoding="utf-8")
print(f"CSV exported to {csv_path.name} ({csv_path.stat().st_size} bytes)")
