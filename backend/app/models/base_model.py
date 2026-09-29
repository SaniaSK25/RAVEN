"""
Common base models for all database entities.

Provides:

- MutableBaseModel
- ImmutableBaseModel
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


class ImmutableBaseModel:
    """
    Base model for immutable entities.

    Records are never updated after creation.
    """

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class MutableBaseModel(ImmutableBaseModel):
    """
    Base model for mutable entities.

    Adds updated_at timestamp.
    """

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )