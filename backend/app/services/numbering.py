"""Human-readable sequential keys (REQ-0001, ...).

The counter row is locked, read, and incremented inside the caller's
transaction — a rolled-back insert restores the counter, so numbers are
never burned or duplicated. Callers must use the key in the same
transaction (same Session) that inserts the numbered row.
"""

from sqlalchemy import select

from app.models.id_counter import IdCounter

COUNTER_NAME = "requirement"
KEY_PREFIX = "REQ"
KEY_WIDTH = 4


def next_req_key(session) -> str:
    """Return the next REQ- number and advance the counter.

    Creates the counter row (starting at 1) on first use so fresh
    databases need no manual seeding.
    """
    row = session.execute(
        select(IdCounter).where(IdCounter.name == COUNTER_NAME).with_for_update()
    ).scalar_one_or_none()
    if row is None:
        row = IdCounter(name=COUNTER_NAME, next_value=1)
        session.add(row)
        session.flush()
    key = f"{KEY_PREFIX}-{row.next_value:0{KEY_WIDTH}d}"
    row.next_value += 1
    session.flush()
    return key
