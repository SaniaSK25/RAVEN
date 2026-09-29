"""
Enumerations for the RAVEN database layer.

All enums derive from ``str`` so values serialize deterministically to
JSON (Pydantic v2 compatible) and compare equal to plain strings. Values
are stored in the database as native ENUM types on PostgreSQL and as
VARCHAR with a CHECK constraint on SQLite.
"""

import enum


class RequirementStatus(str, enum.Enum):
    """Lifecycle status of a Requirement master record."""

    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    SUPERSEDED = "SUPERSEDED"
    RETIRED = "RETIRED"


class RiskBand(str, enum.Enum):
    """Risk band derived from the Risk Priority Number (RPN)."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ComplexityLevel(str, enum.Enum):
    """Complexity level for probability inputs and severity inputs."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class DetectionLevel(str, enum.Enum):
    """
    Detectability level for detection inputs.

    HIGH means a failure is EASY to detect before harm occurs.
    LOW means a failure is HARD to detect before harm occurs.
    """

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AssuranceLevel(str, enum.Enum):
    """Testing rigour selected by the Assurance Engine."""

    UNSCRIPTED = "UNSCRIPTED"
    EXPLORATORY = "EXPLORATORY"
    SCRIPTED = "SCRIPTED"


class ComplianceStatus(str, enum.Enum):
    """Compliance verdict for a framework clause."""

    COMPLIANT = "COMPLIANT"
    PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class TestScriptStatus(str, enum.Enum):
    """Lifecycle status of a generated validation test script."""

    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    SUPERSEDED = "SUPERSEDED"


__all__ = [
    "AssuranceLevel",
    "ComplexityLevel",
    "ComplianceStatus",
    "DetectionLevel",
    "RequirementStatus",
    "RiskBand",
    "TestScriptStatus",
]
