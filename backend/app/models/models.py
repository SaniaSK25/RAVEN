from pydantic import BaseModel, Field
from typing import Literal

class AssuranceDecision(BaseModel):
    assurance_level: Literal["unscripted", "exploratory", "scripted"] = Field(
        description= "The level of testing required. High risk must be scripted. Low/Medium can be unscripted/exploratory."
    )
    rationale: str = Field(
        description= "A 1-2 sentence justification explaining why this testing level is appropriate for the given risk."
    )
    generate_test: bool = Field(
        description= "Must be True ONLY IF assurance_level is 'scripted'. False otherwise."
    )

class TestStep(BaseModel):
    step_number: int
    action: str = Field(
        description= "The action the user must perform in the software."
    )
    expected_result: str = Field(
        description= "What the software should do in response to the action."
    )

class TestScript(BaseModel):
    preconditions: str = Field(
        description= "What must be set up or true before the test begins? (e.g., 'User is ')"
    )