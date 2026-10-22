"""Pydantic schemas for extracted evidence and risk-assessment inputs."""

from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

ComplexityLevel = Literal["LOW", "MEDIUM", "HIGH"]
DetectionLevel = Literal["HIGH", "MEDIUM", "LOW"]


class EvidenceField(BaseModel, Generic[T]):
    """One evidence field: the value plus its audit trail."""

    value: T
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str = Field(min_length=1)


class SeverityEvidence(BaseModel):
    patient_safety: EvidenceField[bool]
    product_quality: EvidenceField[bool]
    batch_release: EvidenceField[bool]
    data_integrity: EvidenceField[bool]
    regulatory_compliance: EvidenceField[bool]
    business_continuity: EvidenceField[bool]


class ProbabilityEvidence(BaseModel):
    functional_complexity: EvidenceField[ComplexityLevel]
    dependency_complexity: EvidenceField[ComplexityLevel]
    workflow_complexity: EvidenceField[ComplexityLevel]


class DetectabilityEvidence(BaseModel):
    detection_controls: EvidenceField[DetectionLevel]
    traceability: EvidenceField[DetectionLevel]
    failure_visibility: EvidenceField[DetectionLevel]


class EvidenceRecord(BaseModel):
    """Frozen input to the Layer 3 engines.

    The two identity fields are optional because extraction assembles a
    record before any row exists. The pipeline stamps the version id, and
    persistence/recompute supply the stored evidence id when rebuilding a
    record from the database.
    """

    requirement_version_id: str | None = None
    evidence_id: str | None = None
    gamp_category: Literal[1, 3, 4, 5]
    gamp_reason: str = Field(min_length=1)
    severity: SeverityEvidence
    probability: ProbabilityEvidence
    detectability: DetectabilityEvidence


class GampClassification(BaseModel):
    """Standalone GAMP verdict used to assemble an EvidenceRecord."""

    gamp_category: Literal[1, 3, 4, 5]
    gamp_reason: str = Field(min_length=1)
