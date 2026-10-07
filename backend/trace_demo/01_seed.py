"""Demo step 1: seed the scenario, run sync, show links + orphans.

Usage:  .venv/Scripts/python.exe trace_demo/01_seed.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from trace_demo.common import DB_PATH, get_session, seed_scenario  # noqa: E402

from app.models.trace_link import TraceLink  # noqa: E402
from app.services.traceability.io import snapshot_from_db  # noqa: E402
from app.services.traceability.orphans import find_orphans, orphan_summary  # noqa: E402
from app.services.traceability.sync import sync_links  # noqa: E402

if DB_PATH.exists():
    DB_PATH.unlink()
    print(f"(removed old {DB_PATH.name})")

session = get_session()
seed_scenario(session)

counts = sync_links(session)
session.commit()

print(f"sync: {counts}")
for link in session.query(TraceLink).order_by(TraceLink.link_type).all():
    print(
        f"  [{link.origin:>6}] {link.src_type}:{link.src_id[:8]} "
        f"--{link.link_type}--> {link.dst_type}:{link.dst_id[:8]} "
        f"(active={link.active}, stale={link.stale})"
    )

orphans = find_orphans(snapshot_from_db(session))
print(f"\norphans: {orphan_summary(orphans)}")
for o in orphans:
    print(f"  {o.type} {o.entity_key} [{o.reason}] {o.detail}")
