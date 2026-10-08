"""
IdCounter model (ORM).

Single-row-per-name counters for human-readable sequential keys
(e.g. ``requirement`` -> REQ-0001, REQ-0002, ...). The counter row is
read and incremented inside the same transaction that inserts the
numbered row, so a rolled-back insert burns no numbers. Portable
across SQLite and PostgreSQL (no DB sequences).
"""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel


class IdCounter(Base, ImmutableBaseModel):
    """Named monotonic counter (one row per sequence)."""

    __tablename__ = "id_counters"

    name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
    )
    """Sequence name, e.g. ``requirement`` (unique; the UUID ``id`` from
    the base stays the primary key)."""

    next_value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    """Next number to hand out; incremented on every assignment."""
