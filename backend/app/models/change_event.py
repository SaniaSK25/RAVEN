"""
ChangeEvent model (ORM).

One row per requirement edit/delete, moving through the state machine
``open -> reanalyzed -> confirmed | accepted`` (plus ``superseded``
when replaced by a later event on the same requirement). See the
TRACEABILITY MATRIX spec, section 6.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel

if TYPE_CHECKING:
    from app.models.requirement import Requirement


class ChangeEvent(Base, ImmutableBaseModel):
    """Record of a requirement change and its impact.

    ``impact`` stores the exact stale set as
    ``{"risks": [...], "assessments": [...], "decisions": [...],
    "tests": [...], "links": [...]}`` with string ids. ``diff`` stores
    the re-analysis diff (``before`` / ``after`` / ``changed_fields`` /
    ``material_change``) once re-analysis has run.
    """

    __tablename__ = "change_events"

    __table_args__ = (
        Index("ix_change_events_requirement_id", "requirement_id"),
        Index("ix_change_events_status", "status"),
        Index("ix_change_events_created_at", "created_at"),
    )

    requirement_id: Mapped[UUID] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
    )
    """Changed requirement; events die with their requirement."""

    kind: Mapped[str] = mapped_column(String(12), nullable=False)
    """``edit`` | ``delete``."""

    status: Mapped[str] = mapped_column(
        String(12),
        nullable=False,
        default="open",
    )
    """``open`` | ``reanalyzed`` | ``confirmed`` | ``accepted`` | ``superseded``."""

    impact: Mapped[dict] = mapped_column(JSON, nullable=False)
    """Exact stale set captured at change time (string-id lists)."""

    diff: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)
    """Re-analysis diff; NULL until ``reanalyzed``."""

    baseline_assessment_id: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        default=None,
    )
    """Risk assessment the diff's ``before`` side was read from."""

    carried_from_event_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("change_events.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
    )
    """Previous superseded event whose impact was unioned into this one."""

    resolution_note: Mapped[str | None] = mapped_column(
        Text, nullable=True, default=None
    )
    """Human note recorded at confirm/accept time."""

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    """When the event reached a terminal state."""

    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    """Identity that recorded the change."""

    requirement: Mapped[Requirement] = relationship()
    """Changed requirement (many -> 1, no back-population needed)."""
