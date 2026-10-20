from pydantic import BaseModel, ConfigDict, Field


class ReanalysisAssessment(BaseModel):
    model_config = ConfigDict(extra="allow")

    severity: int | float | None = None
    probability: int | float | None = None
    detectability: int | float | None = None
    rpn: int | float | None = None
    band: str | None = None
    gxp_impact: bool | None = None
    gamp_category: int | str | None = None
    level: str | None = None
    reason_code: str | None = None


class ReanalyzePayload(BaseModel):
    assessment: ReanalysisAssessment | None = None
    created_by: str = "api"


class ConfirmPayload(BaseModel):
    note: str = Field(min_length=1)


class AcceptPayload(BaseModel):
    note: str | None = None
