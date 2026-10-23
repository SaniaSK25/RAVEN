"""Exact provider token totals for one batched evidence-extraction run."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel


class BatchTokenUsage(Base, ImmutableBaseModel):
    """Batch-level token totals; per-requirement rows are allocated estimates."""

    __tablename__ = "batch_token_usage"

    __table_args__ = (
        CheckConstraint(
            "total_tokens = input_tokens + output_tokens",
            name="ck_batch_token_usage_total",
        ),
        CheckConstraint(
            "input_tokens >= 0 AND output_tokens >= 0",
            name="ck_batch_token_usage_nonnegative",
        ),
        CheckConstraint(
            "requested_count >= 1 AND succeeded_count >= 0 AND failed_count >= 0",
            name="ck_batch_token_usage_counts",
        ),
    )

    status: Mapped[str] = mapped_column(String(20), nullable=False)
    requested_count: Mapped[int] = mapped_column(Integer, nullable=False)
    succeeded_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    requirement_usages = relationship(
        "TokenUsage",
        back_populates="batch_run",
    )
