from pydantic import BaseModel, Field
from typing import Literal

class RequirementAnalysis(BaseModel):
    gamp_category: str = Field(
        description= "The GAMP 5 software category. Must be 'Category 1', 'Category 3', 'Category 4' or 'Category 5'."
    )
    gamp_rationale: str = Field(
        description= "A 1-2 sentence justification for why this GAMP category was chosen."
    )
    gxp_impact: bool = Field(
        description= "True if the requirement impacts patient"
    )