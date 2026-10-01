"""
Stored Evidence model (ORM).

Frozen Agent 1 extraction for one RequirementVersion, mirroring the
Pydantic ``EvidenceRecord`` contract (``app.models.evidence``) in
relational form: every field is a value + confidence + evidence-sentence
triple. Severity flags are booleans; complexity/detection are enums;
GAMP category is an integer 1/3/4/5.

Lives in ``stored_evidence.py`` (not ``evidence.py``) because that module
path holds the Pydantic contract imported across the engines.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, Integer
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.base_model import ImmutableBaseModel
from app.models.enums import ComplexityLevel, DetectionLevel
from app.models.mixins import (
    confidence_check,
    confidence_column,
    evidence_text_column,
    non_empty_check,
    range_check,
)

if TYPE_CHECKING:
    from app.models.requirement_version import RequirementVersion
    from app.models.risk_assessment import RiskAssessment

SEVERITY_FIELDS = (
    "patient_safety",
    "product_quality",
    "batch_release",
    "data_integrity",
    "regulatory_compliance",
    "business_continuity",
)

COMPLEXITY_FIELDS = (
    "functional_complexity",
    "dependency_complexity",
    "workflow_complexity",
)

DETECTION_FIELDS = (
    "detection_controls",
    "traceability",
    "failure_visibility",
)


class Evidence(Base, ImmutableBaseModel):
    """
    Immutable frozen Agent 1 extraction.

    Relationships:
        requirement_version: version this extraction describes (1 -> 1).
        risk_assessments: Layer 3 analyses consuming it (1 -> many).
    """

    __tablename__ = "evidence"

    __table_args__ = (
        Index("ix_evidence_requirement_version_id", "requirement_version_id"),
        Index("ix_evidence_created_at", "created_at"),
        range_check("gamp_category_value", 1, 5),
        non_empty_check("gxp_reason"),
        non_empty_check("gamp_reason"),
        # Per-triple audit checks (confidence 0..1, non-empty sentences).
        *(
            check
            for field in (
                *SEVERITY_FIELDS,
                *COMPLEXITY_FIELDS,
                *DETECTION_FIELDS,
                "gxp_impact",
                "gamp_category",
            )
            for check in (
                confidence_check(f"{field}_confidence"),
                non_empty_check(f"{field}_evidence"),
            )
        ),
    )

    # --- Link ----------------------------------------------------------

    requirement_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("requirement_versions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    """Version described; evidence dies with its version (1 -> 1)."""

    # --- Severity booleans (6 triples) -----------------------------------

    patient_safety_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    patient_safety_confidence: Mapped[float] = confidence_column()
    patient_safety_evidence: Mapped[str] = evidence_text_column()

    product_quality_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    product_quality_confidence: Mapped[float] = confidence_column()
    product_quality_evidence: Mapped[str] = evidence_text_column()

    batch_release_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    batch_release_confidence: Mapped[float] = confidence_column()
    batch_release_evidence: Mapped[str] = evidence_text_column()

    data_integrity_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    data_integrity_confidence: Mapped[float] = confidence_column()
    data_integrity_evidence: Mapped[str] = evidence_text_column()

    regulatory_compliance_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    regulatory_compliance_confidence: Mapped[float] = confidence_column()
    regulatory_compliance_evidence: Mapped[str] = evidence_text_column()

    business_continuity_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    business_continuity_confidence: Mapped[float] = confidence_column()
    business_continuity_evidence: Mapped[str] = evidence_text_column()

    # --- Complexity enums (3 triples) --------------------------------------

    functional_complexity_value: Mapped[ComplexityLevel] = mapped_column(
        SAEnum(ComplexityLevel, name="complexity_level"), nullable=False
    )
    functional_complexity_confidence: Mapped[float] = confidence_column()
    functional_complexity_evidence: Mapped[str] = evidence_text_column()

    dependency_complexity_value: Mapped[ComplexityLevel] = mapped_column(
        SAEnum(ComplexityLevel, name="complexity_level"), nullable=False
    )
    dependency_complexity_confidence: Mapped[float] = confidence_column()
    dependency_complexity_evidence: Mapped[str] = evidence_text_column()

    workflow_complexity_value: Mapped[ComplexityLevel] = mapped_column(
        SAEnum(ComplexityLevel, name="complexity_level"), nullable=False
    )
    workflow_complexity_confidence: Mapped[float] = confidence_column()
    workflow_complexity_evidence: Mapped[str] = evidence_text_column()

    # --- Detection enums (3 triples; HIGH = easy to spot) --------------------

    detection_controls_value: Mapped[DetectionLevel] = mapped_column(
        SAEnum(DetectionLevel, name="detection_level"), nullable=False
    )
    detection_controls_confidence: Mapped[float] = confidence_column()
    detection_controls_evidence: Mapped[str] = evidence_text_column()

    traceability_value: Mapped[DetectionLevel] = mapped_column(
        SAEnum(DetectionLevel, name="detection_level"), nullable=False
    )
    traceability_confidence: Mapped[float] = confidence_column()
    traceability_evidence: Mapped[str] = evidence_text_column()

    failure_visibility_value: Mapped[DetectionLevel] = mapped_column(
        SAEnum(DetectionLevel, name="detection_level"), nullable=False
    )
    failure_visibility_confidence: Mapped[float] = confidence_column()
    failure_visibility_evidence: Mapped[str] = evidence_text_column()

    # --- GxP / GAMP --------------------------------------------------------

    gxp_impact_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    """True when safety, quality, or integrity is affected."""

    gxp_impact_confidence: Mapped[float] = confidence_column()
    gxp_impact_evidence: Mapped[str] = evidence_text_column()

    gxp_reason: Mapped[str] = evidence_text_column()
    """Confirmed GxP justification (non-empty)."""

    gamp_category_value: Mapped[int] = mapped_column(Integer, nullable=False)
    """GAMP 5 category as integer 1/3/4/5."""

    gamp_category_confidence: Mapped[float] = confidence_column()
    gamp_category_evidence: Mapped[str] = evidence_text_column()

    gamp_reason: Mapped[str] = evidence_text_column()
    """Confirmed GAMP justification (non-empty)."""

    # --- Relationships -----------------------------------------------------

    requirement_version: Mapped[RequirementVersion] = relationship(
        back_populates="evidence",
    )
    """Described version (1 -> 1)."""

    risk_assessments: Mapped[list[RiskAssessment]] = relationship(
        back_populates="evidence",
        cascade="all, delete-orphan",
    )
    """Layer 3 analyses consuming this extraction (1 -> many)."""
