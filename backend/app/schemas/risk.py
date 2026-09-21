import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import RiskBand


class SeverityResult(BaseModel):
    score: int = Field(..., ge=1, le=5)
    decision_path: list[dict]
    justification: str


class ProbabilityResult(BaseModel):
    score: int = Field(..., ge=1, le=5)
    decision_path: list[dict]
    justification: str


class DetectabilityResult(BaseModel):
    score: int = Field(..., ge=1, le=5)
    decision_path: list[dict]
    justification: str


class RiskAssessmentResponse(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    severity_score: int
    probability_score: int
    detectability_score: int
    risk_priority_number: int
    risk_band: RiskBand
    decision_path: list[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class RiskOverview(BaseModel):
    severity: SeverityResult | None
    probability: ProbabilityResult | None
    detectability: DetectabilityResult | None
    risk_assessment: RiskAssessmentResponse | None


class AssessmentStoredResult(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    score: int
    decision_path: list[dict]
    justification: str
    created_at: datetime

    model_config = {"from_attributes": True}
