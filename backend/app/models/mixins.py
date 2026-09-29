"""
Shared column factories and CHECK-constraint builders.

Every factory returns a ``mapped_column()`` so models keep full
SQLAlchemy 2 typed-ORM support. CHECK constraints are created with the
builder functions and must be listed in each model's ``__table_args__``
so they are enforced at the database level on both PostgreSQL and
SQLite.
"""

from sqlalchemy import CheckConstraint, Float, Text
from sqlalchemy.orm import mapped_column

# ==========================================================
# CHECK-constraint builders
# ==========================================================


def confidence_check(column_name: str) -> CheckConstraint:
    """Build ``0 <= <column> <= 1`` CHECK for a confidence score."""

    return CheckConstraint(
        f"{column_name} >= 0 AND {column_name} <= 1",
        name=f"ck_{column_name}_range",
    )


def range_check(column_name: str, low: int, high: int) -> CheckConstraint:
    """Build ``low <= <column> <= high`` CHECK for an integer score."""

    return CheckConstraint(
        f"{column_name} >= {low} AND {column_name} <= {high}",
        name=f"ck_{column_name}_range",
    )


def non_empty_check(column_name: str) -> CheckConstraint:
    """
    Build ``length(<column>) > 0`` CHECK for a text column.

    ``length()`` is supported by both PostgreSQL and SQLite, which keeps
    the DDL portable across the development and production databases.
    """

    return CheckConstraint(
        f"length({column_name}) > 0",
        name=f"ck_{column_name}_non_empty",
    )


# ==========================================================
# Column factories
# ==========================================================


def confidence_column():
    """NOT NULL confidence score column (0..1, CHECK in __table_args__)."""

    return mapped_column(Float, nullable=False)


def evidence_text_column():
    """NOT NULL evidence-sentence column (non-empty CHECK in __table_args__)."""

    return mapped_column(Text, nullable=False)


def reasoning_column():
    """NOT NULL reasoning column (non-empty CHECK in __table_args__)."""

    return mapped_column(Text, nullable=False)


__all__ = [
    "confidence_check",
    "confidence_column",
    "evidence_text_column",
    "non_empty_check",
    "range_check",
    "reasoning_column",
]
