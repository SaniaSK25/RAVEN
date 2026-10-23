"""Token usage recorded for each analysis of a requirement version."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel

if TYPE_CHECKING:
    from app.models.requirement_version import RequirementVersion


class TokenUsage(Base, ImmutableBaseModel):
    """One analysis run's provider token usage, including validation retries."""

    __tablename__ = "token_usage"

    __table_args__ = (
        Index("ix_token_usage_requirement_version_id", "requirement_version_id"),
        Index("ix_token_usage_batch_run_id", "batch_run_id"),
        CheckConstraint(
            "total_tokens = input_tokens + output_tokens",
            name="ck_token_usage_total",
        ),
        CheckConstraint(
            "input_tokens >= 0 AND output_tokens >= 0",
            name="ck_token_usage_nonnegative",
        ),
    )

    requirement_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("requirement_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    batch_run_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("batch_token_usage.id", ondelete="SET NULL"),
        nullable=True,
    )
    usage_basis: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="actual",
        server_default="actual",
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    extraction_input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    extraction_output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    script_input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    script_output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    requirement_version: Mapped[RequirementVersion] = relationship(
        back_populates="token_usage_records",
    )
    batch_run = relationship(
        "BatchTokenUsage",
        back_populates="requirement_usages",
    )
