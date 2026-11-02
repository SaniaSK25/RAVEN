"""Persisted manual requirement-classification assessments."""

from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import MutableBaseModel


class ComplianceAssessmentRun(Base, MutableBaseModel):
    """One user-triggered assessment and its completion state."""

    __tablename__ = "compliance_assessment_runs"

    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    requested_count: Mapped[int] = mapped_column(Integer, nullable=False)
    total_batches: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_batches: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_batch: Mapped[int | None] = mapped_column(Integer, nullable=True)
    requirements_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    requirement_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_totals: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    batch_usages = relationship(
        "ComplianceBatchUsage",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="ComplianceBatchUsage.created_at",
    )
