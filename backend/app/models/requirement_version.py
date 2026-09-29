"""
RequirementVersion model.

Immutable snapshot of a requirement's text. A new row is appended for
every edit; rows are never updated in place, which gives every downstream
engine (Agent 1, Risk Engine, Assurance Engine, Test Script Generator,
Compliance Engine) a stable, auditable input.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel

if TYPE_CHECKING:
    from app.models.compliance_result import ComplianceResult
    from app.models.evidence import Evidence
    from app.models.requirement import Requirement
    from app.models.risk_assessment import RiskAssessment
    from app.models.test_script import TestScript


class RequirementVersion(Base, ImmutableBaseModel):
    """
    Immutable version of a requirement's text.

    Relationships:
        requirement: owning master record (many -> 1).
        evidence: Agent 1 extraction for this version (1 -> 1).
        risk_assessments: Layer 3 analyses run against this version
            (1 -> many).
        test_scripts: generated validation scripts (1 -> many).
        compliance_results: framework clause verdicts (1 -> many).
    """

    __tablename__ = "requirement_versions"

    __table_args__ = (
        UniqueConstraint(
            "requirement_id",
            "version_number",
            name="uq_requirement_versions_requirement_version",
        ),
        # Exactly one current version per requirement (enforced on
        # PostgreSQL and SQLite; both support partial indexes).
        Index(
            "uq_requirement_versions_current",
            "requirement_id",
            unique=True,
            sqlite_where=text("is_current"),
            postgresql_where=text("is_current"),
        ),
        Index("ix_requirement_versions_requirement_id", "requirement_id"),
        Index("ix_requirement_versions_created_at", "created_at"),
    )

    # --- Identity ----------------------------------------------------

    requirement_id: Mapped[UUID] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
    )
    """Owning requirement; versions die with their requirement."""

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    """Monotonic version number, scoped to the parent requirement."""

    # --- Content -----------------------------------------------------

    text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    """Full requirement text for this version."""

    hash_sha256: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )
    """SHA-256 hex digest of ``text``; detects duplicate submissions."""

    is_current: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )
    """True for the single active version of the requirement."""

    # --- Relationships -----------------------------------------------

    requirement: Mapped[Requirement] = relationship(
        back_populates="versions",
        foreign_keys=[requirement_id],
    )
    """Owning master record (many -> 1)."""

    evidence: Mapped[Evidence | None] = relationship(
        back_populates="requirement_version",
        cascade="all, delete-orphan",
        uselist=False,
    )
    """Agent 1 extraction for this version (1 -> 1)."""

    risk_assessments: Mapped[list[RiskAssessment]] = relationship(
        back_populates="requirement_version",
        cascade="all, delete-orphan",
    )
    """Layer 3 analyses run against this version (1 -> many)."""

    test_scripts: Mapped[list[TestScript]] = relationship(
        back_populates="requirement_version",
        cascade="all, delete-orphan",
    )
    """Validation scripts generated for this version (1 -> many)."""

    compliance_results: Mapped[list[ComplianceResult]] = relationship(
        back_populates="requirement_version",
        cascade="all, delete-orphan",
    )
    """Framework clause verdicts for this version (1 -> many)."""
