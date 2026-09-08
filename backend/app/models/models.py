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
        description= "True if the requirement impacts patient safety, product quality, or data integrity; False otherwise."
    )
    gxp_rationale: str = Field(
        description= "A 1-2 sentence explanation of the GxP impact decision."
    )

    severity_fact: str = Field(
        description= "What is the potential severity of failure if this requirement is not met? Extract factual reasoning."
    )
    probability_fact: str = Field(
        description= "What is the factual likelihood of a failure occurring?"
    )
    detectability_fact: str = Field(
        description= "If a failure occurs, what is the factual likelihood it will be detected before harming a patient?"
    )
    severity_level: Literal["Low", "Medium", "High", "Critical"] = Field(
        description= "Based on the severity fact, categorize the severity."
    )
    probability_level: Literal["Low", "Medium", "High"] = Field(
        description= "Based on the probability fact, categorize the likelihood."
    )
    detectability_level: Literal["High", "Medium", "Low"] = Field(
        description= "Categorize detectability. (High detectability means it is EASY to catch before harm)."
    )

class RequirementDB(BaseModel):
    id: str
    requirement_code: str
    title: str
    description: str
    gamp_category: str
    gamp_rationale: str
    gxp_impact: str
    gxp_rationale: str
    severity_fact: str
    probability_fact: str
    detectability_fact: str
    version: int
    is_stale: bool

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