"""
Severity / Probability / Detectability result models (ORM).

Immutable persistence of one deterministic engine output each, storing
exactly what the engines return: score, rule_id, rule_version,
decision_path, reasoning — plus the engine-specific computation inputs
(weighted sum + GAMP modifier for probability; controls floor for
detectability) so any stored score is re-derivable without re-running.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel
from app.models.mixins import non_empty_check, range_check, reasoning_column

if TYPE_CHECKING:
    from app.models.risk_assessment import RiskAssessment


class SeverityResult(Base, ImmutableBaseModel):
    """Immutable persisted severity engine output (SEV-R1..R7)."""

    __tablename__ = "severity_results"

    __table_args__ = (
        Index("ix_severity_results_risk_assessment_id", "risk_assessment_id"),
        Index("ix_severity_results_created_at", "created_at"),
        range_check("score", 1, 5),
        non_empty_check("rule_id"),
        non_empty_check("reasoning"),
    )

    risk_assessment_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("risk_assessments.id", ondelete="SET NULL"),
        nullable=True,
    )
    """Owning assessment; NULL until linked (engines persist independently)."""

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    """Severity score 1-5."""

    rule_id: Mapped[str] = mapped_column(String(20), nullable=False)
    """Fired rule, e.g. SEV-R4 (non-empty)."""

    rule_version: Mapped[str] = mapped_column(String(20), nullable=False)
    """Rule snapshot version this score was computed with."""

    decision_path: Mapped[list] = mapped_column(JSON, nullable=False)
    """Ordered evaluated conditions (list of dicts)."""

    reasoning: Mapped[str] = reasoning_column()
    """Human-readable justification (non-empty)."""

    risk_assessment: Mapped[RiskAssessment | None] = relationship(
        foreign_keys=[risk_assessment_id],
        uselist=False,
    )
    """Owning assessment (one-directional; see RiskAssessment docstring)."""


class ProbabilityResult(Base, ImmutableBaseModel):
    """Immutable persisted probability engine output (PROB-S<sum>)."""

    __tablename__ = "probability_results"

    __table_args__ = (
        Index("ix_probability_results_risk_assessment_id", "risk_assessment_id"),
        Index("ix_probability_results_created_at", "created_at"),
        range_check("score", 1, 5),
        non_empty_check("rule_id"),
        non_empty_check("reasoning"),
    )

    risk_assessment_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("risk_assessments.id", ondelete="SET NULL"),
        nullable=True,
    )
    """Owning assessment; NULL until linked."""

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    """Probability score 1-5."""

    rule_id: Mapped[str] = mapped_column(String(20), nullable=False)
    """Rule id encoding the weighted sum, e.g. PROB-S9 (non-empty)."""

    rule_version: Mapped[str] = mapped_column(String(20), nullable=False)
    """Rule snapshot version this score was computed with."""

    decision_path: Mapped[list] = mapped_column(JSON, nullable=False)
    """Per-field points/weights plus computation entry."""

    weighted_sum: Mapped[float] = mapped_column(nullable=False)
    """Raw 2F+D+W sum (4-12) for audit re-derivation."""

    gamp_modifier: Mapped[float] = mapped_column(nullable=False)
    """GAMP uplift applied (0 by default)."""

    reasoning: Mapped[str] = reasoning_column()
    """Human-readable justification (non-empty)."""

    risk_assessment: Mapped[RiskAssessment | None] = relationship(
        foreign_keys=[risk_assessment_id],
        uselist=False,
    )
    """Owning assessment (one-directional)."""


class DetectabilityResult(Base, ImmutableBaseModel):
    """Immutable persisted detectability engine output (DET-S<sum>)."""

    __tablename__ = "detectability_results"

    __table_args__ = (
        Index("ix_detectability_results_risk_assessment_id", "risk_assessment_id"),
        Index("ix_detectability_results_created_at", "created_at"),
        range_check("score", 1, 5),
        non_empty_check("rule_id"),
        non_empty_check("reasoning"),
    )

    risk_assessment_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("risk_assessments.id", ondelete="SET NULL"),
        nullable=True,
    )
    """Owning assessment; NULL until linked."""

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    """Detectability score 1-5 (5 = nearly invisible failure)."""

    rule_id: Mapped[str] = mapped_column(String(20), nullable=False)
    """Rule id encoding the point sum, e.g. DET-S4 (non-empty)."""

    rule_version: Mapped[str] = mapped_column(String(20), nullable=False)
    """Rule snapshot version this score was computed with."""

    decision_path: Mapped[list] = mapped_column(JSON, nullable=False)
    """Per-factor points plus computation entry."""

    controls_floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    """Configured floor (NULL = off)."""

    reasoning: Mapped[str] = reasoning_column()
    """Human-readable justification (non-empty)."""

    risk_assessment: Mapped[RiskAssessment | None] = relationship(
        foreign_keys=[risk_assessment_id],
        uselist=False,
    )
    """Owning assessment (one-directional)."""
