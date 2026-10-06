"""
RiskAssessment model.

One complete Layer 3 analysis for a RequirementVersion. The row links
the Agent 1 evidence, the deterministic rule snapshot, the GxP/GAMP
classification and the three independent sub-results (severity,
probability, detectability) together with the resulting RPN and band.

Sub-result links (``severity_result_id`` etc.) are nullable so each
engine can persist its output independently: the assessment row is
created first and linked as sub-results complete.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import MutableBaseModel
from app.models.enums import RiskBand
from app.models.mixins import evidence_text_column, non_empty_check, range_check

if TYPE_CHECKING:
    from app.models.assurance_decision import AssuranceDecision
    from app.models.configuration_version import ConfigurationVersion
    from app.models.engine_results import (
        DetectabilityResult,
        ProbabilityResult,
        SeverityResult,
    )
    from app.models.requirement_version import RequirementVersion
    from app.models.stored_evidence import Evidence


class RiskAssessment(Base, MutableBaseModel):
    """
    One complete Layer 3 risk analysis (mutable flags, auditable scores).

    Relationships:
        requirement_version: analysed version (many -> 1).
        evidence: Agent 1 extraction consumed (many -> 1).
        rule_config: rule snapshot applied (many -> 1).
        severity_result / probability_result / detectability_result:
            independent sub-results (1 <-> 1 each).
        assurance_decision: downstream assurance verdict (1 -> 1).
    """

    __tablename__ = "risk_assessments"

    __table_args__ = (
        Index("ix_risk_assessments_requirement_version_id", "requirement_version_id"),
        Index("ix_risk_assessments_evidence_id", "evidence_id"),
        Index("ix_risk_assessments_status", "status"),
        Index("ix_risk_assessments_created_at", "created_at"),
        # Exactly one current assessment per requirement version.
        Index(
            "uq_risk_assessments_current",
            "requirement_version_id",
            unique=True,
            sqlite_where=text("is_current"),
            postgresql_where=text("is_current"),
        ),
        range_check("rpn", 1, 125),
        non_empty_check("gxp_reason"),
        non_empty_check("gamp_reason"),
    )

    # --- Inputs --------------------------------------------------------

    requirement_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("requirement_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    """Analysed requirement version."""

    evidence_id: Mapped[UUID] = mapped_column(
        ForeignKey("evidence.id", ondelete="CASCADE"),
        nullable=False,
    )
    """Agent 1 evidence consumed by this analysis."""

    severity_result_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("severity_results.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    """Linked severity sub-result (NULL until the engine persists it)."""

    probability_result_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("probability_results.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    """Linked probability sub-result (NULL until the engine persists it)."""

    detectability_result_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("detectability_results.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    """Linked detectability sub-result (NULL until the engine persists it)."""

    rule_config_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("configuration_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    """
    Rule snapshot applied. ``RESTRICT`` protects audited analyses from
    losing the rules they were computed with.
    """

    # --- Classification (Layer 3 confirmed) ------------------------------

    gxp_impact: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )
    """Confirmed GxP impact flag."""

    gxp_reason: Mapped[str] = evidence_text_column()
    """Justification for the confirmed GxP impact (non-empty)."""

    gamp_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    """Confirmed GAMP 5 software category."""

    gamp_reason: Mapped[str] = evidence_text_column()
    """Justification for the confirmed GAMP category (non-empty)."""

    # --- Deterministic output --------------------------------------------

    rpn: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    """Risk Priority Number: 12 x severity + 5 x probability + 3 x detectability [20, 100]."""

    band: Mapped[RiskBand] = mapped_column(
        SAEnum(RiskBand, name="risk_band"),
        nullable=False,
        index=True,
    )
    """Risk band derived from the RPN (LOW / MEDIUM / HIGH)."""

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="DRAFT",
    )
    """Lifecycle status: DRAFT -> FINAL -> SUPERSEDED."""

    is_current: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )
    """True for the single active assessment of the requirement version."""

    # --- Relationships ----------------------------------------------------

    requirement_version: Mapped[RequirementVersion] = relationship(
        back_populates="risk_assessments",
    )
    """Analysed version (many -> 1)."""

    evidence: Mapped[Evidence] = relationship(
        back_populates="risk_assessments",
    )
    """Agent 1 evidence consumed (many -> 1)."""

    rule_config: Mapped[ConfigurationVersion] = relationship(
        back_populates="risk_assessments",
    )
    """Rule snapshot applied (many -> 1)."""

    severity_result: Mapped[SeverityResult | None] = relationship(
        foreign_keys=[severity_result_id],
        uselist=False,
    )
    """
    Severity sub-result (1 <-> 1, nullable until linked).

    One-directional: the association carries a FK on BOTH tables
    (``severity_result_id`` here and ``risk_assessment_id`` there), so
    the two navigations cannot be paired with ``back_populates`` (both
    would resolve as MANYTOONE). Both agree on committed database state.
    """

    probability_result: Mapped[ProbabilityResult | None] = relationship(
        foreign_keys=[probability_result_id],
        uselist=False,
    )
    """Probability sub-result (1 <-> 1, nullable until linked; see above)."""

    detectability_result: Mapped[DetectabilityResult | None] = relationship(
        foreign_keys=[detectability_result_id],
        uselist=False,
    )
    """Detectability sub-result (1 <-> 1, nullable until linked; see above)."""

    assurance_decision: Mapped[AssuranceDecision | None] = relationship(
        back_populates="risk_assessment",
        cascade="all, delete-orphan",
        uselist=False,
    )
    """Downstream assurance verdict (1 -> 1)."""
