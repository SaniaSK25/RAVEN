"""
TraceLink model (ORM).

Single source of truth for the traceability graph. Rows are managed by
the sync process (:mod:`app.services.traceability.sync`); see the
TRACEABILITY MATRIX spec, sections 1.3-1.5 and 3.
"""

from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.base_model import MutableBaseModel


class TraceLink(Base, MutableBaseModel):
    """One typed edge between two traceability nodes.

    Node ids are stored as strings so the table works with the UUID
    primary keys used across RAVEN (``str(requirement.id)`` etc.).
    """

    __tablename__ = "trace_links"

    __table_args__ = (
        UniqueConstraint(
            "src_type",
            "src_id",
            "dst_type",
            "dst_id",
            "link_type",
            name="uq_trace_links_endpoints_type",
        ),
        Index("ix_trace_links_src", "src_type", "src_id"),
        Index("ix_trace_links_dst", "dst_type", "dst_id"),
        Index("ix_trace_links_type", "link_type"),
        Index("ix_trace_links_origin", "origin"),
        # Endpoint types are fixed per edge type (spec section 1.2).
        CheckConstraint(
            "(link_type = 'has_risk' AND src_type = 'requirement' AND dst_type = 'risk') OR "
            "(link_type = 'assessed_as' AND src_type = 'risk' AND dst_type = 'assurance') OR "
            "(link_type = 'mitigated_by' AND src_type = 'assurance' AND dst_type = 'test') OR "
            "(link_type = 'verifies' AND src_type = 'test' AND dst_type = 'requirement')",
            name="ck_trace_links_type_endpoints",
        ),
        # Suppressed rows are always inactive (spec section 1.3).
        CheckConstraint(
            "NOT (suppressed AND active)",
            name="ck_trace_links_suppressed_inactive",
        ),
        # Only system rows may be suppressed (spec section 1.3).
        CheckConstraint(
            "origin = 'system' OR NOT suppressed",
            name="ck_trace_links_suppressed_system_only",
        ),
    )

    src_type: Mapped[str] = mapped_column(String(16), nullable=False)
    """Source node type: requirement | risk | assurance | test."""

    src_id: Mapped[str] = mapped_column(String(64), nullable=False)
    """Source node id as string (UUID hex for RAVEN rows)."""

    dst_type: Mapped[str] = mapped_column(String(16), nullable=False)
    """Destination node type."""

    dst_id: Mapped[str] = mapped_column(String(64), nullable=False)
    """Destination node id as string."""

    link_type: Mapped[str] = mapped_column(String(16), nullable=False)
    """Edge type: has_risk | assessed_as | mitigated_by | verifies."""

    origin: Mapped[str] = mapped_column(
        String(12),
        nullable=False,
        default="system",
    )
    """system | manual | import."""

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )
    """Is this edge currently valid?"""

    suppressed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    """System link manually removed; sync must not resurrect it."""

    stale: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )
    """Derived: either endpoint has freshness ``stale`` (sync refreshes)."""

    created_by: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="system",
    )
    """Identity that created the link."""
