"""
ComplianceResult model.

Immutable verdict of the Compliance Engine for one framework clause
against one RequirementVersion.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel
from app.models.enums import ComplianceStatus
from app.models.mixins import (
    confidence_check,
    non_empty_check,
    reasoning_column,
)

if TYPE_CHECKING:
    from app.models.prompt_version import PromptVersion
    from app.models.requirement_version import RequirementVersion


class ComplianceResult(Base, ImmutableBaseModel):
    """
    Immutable clause-level compliance verdict.

    Relationships:
        requirement_version: assessed version (many -> 1).
        prompt_version: analysis prompt snapshot used (many -> 1).
    """

    __tablename__ = "compliance_results"

    __table_args__ = (
        Index("ix_compliance_results_requirement_version_id", "requirement_version_id"),
        Index("ix_compliance_results_prompt_version_id", "prompt_version_id"),
        Index("ix_compliance_results_status", "status"),
        Index("ix_compliance_results_framework_clause", "framework", "clause"),
        Index("ix_compliance_results_created_at", "created_at"),
        confidence_check("coverage"),
        non_empty_check("reasoning"),
        non_empty_check("framework"),
        non_empty_check("clause"),
    )

    # --- Identity ----------------------------------------------------

    requirement_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("requirement_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    """Assessed requirement version; verdicts die with their version."""

    prompt_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    """
    Analysis prompt snapshot used. ``RESTRICT`` preserves
    reproducibility of every verdict.
    """

    # --- Verdict ---------------------------------------------------------

    framework: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    """Regulatory framework (e.g. 'FDA 21 CFR Part 11', 'EU GMP Annex 11')."""

    clause: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    """Framework clause identifier assessed."""

    status: Mapped[ComplianceStatus] = mapped_column(
        SAEnum(ComplianceStatus, name="compliance_status"),
        nullable=False,
    )
    """Compliance verdict for the clause."""

    coverage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    """Fraction of the clause covered by the requirement, in [0, 1]."""

    reasoning: Mapped[str] = reasoning_column()
    """Human-readable justification (non-empty)."""

    # --- Relationships -----------------------------------------------------

    requirement_version: Mapped[RequirementVersion] = relationship(
        back_populates="compliance_results",
    )
    """Assessed version (many -> 1)."""

    prompt_version: Mapped[PromptVersion] = relationship(
        back_populates="compliance_results",
    )
    """Analysis prompt snapshot used (many -> 1)."""
