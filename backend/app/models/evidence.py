"""RAVEN Layer 3 evidence record — the frozen analyzer output.

Every field carries value + confidence + evidence sentence. The engines
(severity / probability / detectability) read ONLY `value`; confidence and
evidence travel alongside for audit but never affect the score.

Note: the Layer 3 spec says "20 evidence fields" but enumerates 12
Layer-3-relevant ones (6 severity + 3 probability + 3 detectability).
Only the enumerated fields are implemented here — nothing invented.
"""

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
    """Frozen input to the Layer 3 engines."""

    gamp_category: Literal[1, 3, 4, 5]
    gamp_reason: str = Field(min_length=1)
    severity: SeverityEvidence
    probability: ProbabilityEvidence
    detectability: DetectabilityEvidence


class GampClassification(BaseModel):
    """Standalone GAMP verdict so it can be extracted in its own small
    LLM call, then assembled into EvidenceRecord in code."""

    gamp_category: Literal[1, 3, 4, 5]
    gamp_reason: str = Field(min_length=1)
