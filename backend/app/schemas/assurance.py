from typing import Literal

from pydantic import BaseModel, Field


class AssuranceDecision(BaseModel):
    assurance_level: Literal["unscripted", "exploratory", "scripted"] = Field(
        description=(
            "The level of testing required. High risk must be scripted. "
            "Low/Medium can be unscripted/exploratory."
        )
    )
    rationale: str = Field(
        min_length=1,
        description=(
            "A 1-2 sentence justification explaining why this testing level "
            "is appropriate for the given risk."
        ),
    )
    generate_test: bool = Field(
        description="Must be True ONLY IF assurance_level is 'scripted'. False otherwise."
    )
