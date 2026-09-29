"""
Requirement model.

Master record for a single logical requirement. The human-readable text
lives in :class:`RequirementVersion` so the complete edit history is
preserved; this row tracks identity, lifecycle status and the pointer to
the current version.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import MutableBaseModel
from app.models.enums import RequirementStatus

if TYPE_CHECKING:
    from app.models.requirement_version import RequirementVersion


class Requirement(Base, MutableBaseModel):
    """
    Master requirement record (mutable lifecycle, immutable history).

    Relationships:
        versions: all immutable versions, oldest first.
        current_version: the version flagged as current (nullable until
            the first version is created).
    """

    __tablename__ = "requirements"

    __table_args__ = (
        Index("ix_requirements_status", "status"),
        Index("ix_requirements_created_at", "created_at"),
    )

    # --- Identity / content -----------------------------------------

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    """Short human-readable requirement title."""

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    """Full requirement description as captured from the source."""

    # --- Lifecycle ---------------------------------------------------

    status: Mapped[RequirementStatus] = mapped_column(
        SAEnum(RequirementStatus, name="requirement_status"),
        nullable=False,
        default=RequirementStatus.DRAFT,
    )
    """Lifecycle status of the requirement master record."""

    created_by: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    """Identity (user id / service name) that created the requirement."""

    current_version_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "requirement_versions.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        unique=True,
        index=True,
    )
    """
    Pointer to the current RequirementVersion.

    Nullable because a Requirement exists before its first version is
    persisted. ``SET NULL`` keeps the master record deletable-safe when
    the pointed-to version row is removed.
    """

    # --- Relationships -----------------------------------------------

    versions: Mapped[list[RequirementVersion]] = relationship(
        back_populates="requirement",
        cascade="all, delete-orphan",
        foreign_keys="RequirementVersion.requirement_id",
        order_by="RequirementVersion.version_number",
    )
    """All immutable versions of this requirement (1 -> many)."""

    current_version: Mapped[RequirementVersion | None] = relationship(
        foreign_keys=[current_version_id],
        post_update=True,
    )
    """The currently active version (many -> 1, nullable)."""
