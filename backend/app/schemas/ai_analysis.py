import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AIAnalysisCreate(BaseModel):
    severity_analysis: dict = Field(
        ...,
        examples=[
            {
                "safety_impact": "high",
                "system_function": "core",
                "compliance_impact": True,
                "severity_label": "CRITICAL",
            }
        ],
    )
    probability_analysis: dict = Field(
        ...,
        examples=[
            {
                "failure_rate": "high",
                "operational_exposure": "continuous",
                "environmental_stress": True,
                "probability_label": "HIGH",
            }
        ],
    )
    detectability_analysis: dict = Field(
        ...,
        examples=[
            {
                "detection_method": "automated_monitoring",
                "detection_coverage": 0.85,
                "response_time": "fast",
                "detectability_label": "MODERATE",
            }
        ],
    )


class AIAnalysisResponse(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    severity_analysis: dict
    probability_analysis: dict
    detectability_analysis: dict
    created_at: datetime

    model_config = {"from_attributes": True}
