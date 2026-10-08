"""
AssuranceDecision model (ORM).

Immutable downstream verdict for one RiskAssessment: the testing rigour
selected by the deterministic assurance rules (severity floor first,
then band). Test scripts survive decision supersession via SET NULL on
their side, so new verdicts are new rows here, never updates.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, Boolean, ForeignKey, Index, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel
from app.models.enums import AssuranceLevel
from app.models.mixins import non_empty_check, reasoning_column

if TYPE_CHECKING:
    from app.models.risk_assessment import RiskAssessment
    from app.models.test_script import TestScript


class AssuranceDecision(Base, ImmutableBaseModel):
    """
    Immutable assurance verdict.

    Relationships:
        risk_assessment: analysis this verdict answers (many -> 1).
        test_scripts: scripts this verdict required (1 -> many, surviving).
    """

    __tablename__ = "assurance_decisions"

    __table_args__ = (
        Index("ix_assurance_decisions_risk_assessment_id", "risk_assessment_id"),
        Index("ix_assurance_decisions_created_at", "created_at"),
        non_empty_check("rule_id"),
        non_empty_check("reasoning"),
    )

    # --- Link ----------------------------------------------------------

    risk_assessment_id: Mapped[UUID] = mapped_column(
        ForeignKey("risk_assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    """Answered analysis; verdicts die with their assessment."""

    # --- Verdict ---------------------------------------------------------

    assurance_level: Mapped[AssuranceLevel] = mapped_column(
        SAEnum(AssuranceLevel, name="assurance_level"),
        nullable=False,
    )
    """Selected rigour (UNSCRIPTED / EXPLORATORY / SCRIPTED).

    Engine outputs lowercase (``scripted``); the persistence bridge maps
    to these enum values on write.
    """

    rule_id: Mapped[str] = mapped_column(String(20), nullable=False)
    """Fired rule: ASR-SEV-FLOOR, ASR-BAND-HIGH/MEDIUM/LOW (non-empty)."""

    rule_version: Mapped[str] = mapped_column(String(20), nullable=False)
    """Rule snapshot version this verdict was computed with."""

    generate_test: Mapped[bool] = mapped_column(Boolean, nullable=False)
    """True only for scripted verdicts (a test script must be generated)."""

    reasoning: Mapped[str] = reasoning_column()
    """Human-readable justification (non-empty)."""

    decision_path: Mapped[dict] = mapped_column(JSON, nullable=False)
    """Inputs behind the verdict (severity score, band, level)."""

    freshness: Mapped[str] = mapped_column(String(12), nullable=False,
                                           default="fresh", server_default="fresh",
                                           index=True)
    """Traceability freshness: ``fresh`` | ``stale`` | ``superseded``."""

    # --- Relationships -----------------------------------------------------

    risk_assessment: Mapped[RiskAssessment] = relationship(
        back_populates="assurance_decision",
    )
    """Answered analysis (many -> 1)."""

    test_scripts: Mapped[list[TestScript]] = relationship(
        back_populates="assurance_decision",
    )
    """Required scripts (1 -> many; survive via SET NULL)."""
