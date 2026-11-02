"""Actual and estimated token accounting for each classification invocation."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel


class ComplianceBatchUsage(Base, ImmutableBaseModel):
    """One row per model invocation, including invocations that fail."""

    __tablename__ = "compliance_batch_usages"

    assessment_id: Mapped[UUID] = mapped_column(
        ForeignKey("compliance_assessment_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_number: Mapped[int] = mapped_column(Integer, nullable=False)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    requirements_processed: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actual_output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    max_output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    assessment = relationship(
        "ComplianceAssessmentRun",
        back_populates="batch_usages",
    )
