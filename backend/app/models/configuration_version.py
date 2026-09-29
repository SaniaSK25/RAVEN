"""
ConfigurationVersion model.

Immutable snapshot of the deterministic rule configuration consumed by
the Risk Engine and Assurance Engine. Every RiskAssessment links to the
exact snapshot it was computed with, so historic verdicts remain
reproducible after rules evolve.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel

if TYPE_CHECKING:
    from app.models.risk_assessment import RiskAssessment


class ConfigurationVersion(Base, ImmutableBaseModel):
    """
    Immutable rule-configuration snapshot.

    Relationships:
        risk_assessments: analyses computed with this snapshot
            (1 -> many).
    """

    __tablename__ = "configuration_versions"

    __table_args__ = (
        Index("ix_configuration_versions_version", "version"),
        Index("ix_configuration_versions_created_at", "created_at"),
    )

    # --- Identity ----------------------------------------------------

    version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )
    """Rule-set version label (e.g. '3.2.0')."""

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    """Optional human-readable summary of what changed in this snapshot."""

    config_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )
    """SHA-256 hex digest of the canonical rule payload."""

    # --- Relationships ---------------------------------------------------

    risk_assessments: Mapped[list[RiskAssessment]] = relationship(
        back_populates="rule_config",
    )
    """Analyses computed with this snapshot (1 -> many)."""
