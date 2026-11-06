"""Persisted requirement imports and their on-demand analysis progress."""

from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.base_model import MutableBaseModel


class RequirementIngestionBatch(Base, MutableBaseModel):
    __tablename__ = "requirement_ingestion_batches"

    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    requested_count: Mapped[int] = mapped_column(Integer, nullable=False)
    requirement_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    analysis_results: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    token_totals: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
