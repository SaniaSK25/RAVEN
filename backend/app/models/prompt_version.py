"""
PromptVersion model (ORM).

Immutable snapshot of one agent prompt: every LLM call records which
prompt text (by hash) produced it, so extractions, scripts, and
compliance verdicts stay reproducible after prompts evolve.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel
from app.models.mixins import non_empty_check

if TYPE_CHECKING:
    from app.models.compliance_result import ComplianceResult
    from app.models.test_script import TestScript


class PromptVersion(Base, ImmutableBaseModel):
    """
    Immutable agent prompt snapshot.

    Relationships:
        test_scripts: scripts generated with it (1 -> many).
        compliance_results: verdicts analysed with it (1 -> many).
    """

    __tablename__ = "prompt_versions"

    __table_args__ = (
        UniqueConstraint("agent_name", "version", name="uq_prompt_versions_agent_ver"),
        Index("ix_prompt_versions_agent_name", "agent_name"),
        Index("ix_prompt_versions_created_at", "created_at"),
        non_empty_check("prompt"),
    )

    # --- Identity ----------------------------------------------------------

    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    """Owning agent, e.g. agent_1, test_script_generator."""

    version: Mapped[int] = mapped_column(Integer, nullable=False)
    """Monotonic version per agent."""

    # --- Content -------------------------------------------------------------

    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    """Full prompt text at this version (non-empty)."""

    hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    """SHA-256 hex of agent + version + text (content-addressed)."""

    # --- Relationships ---------------------------------------------------------

    test_scripts: Mapped[list[TestScript]] = relationship(
        back_populates="prompt_version",
    )
    """Scripts generated with this snapshot (1 -> many)."""

    compliance_results: Mapped[list[ComplianceResult]] = relationship(
        back_populates="prompt_version",
    )
    """Verdicts analysed with this snapshot (1 -> many)."""
