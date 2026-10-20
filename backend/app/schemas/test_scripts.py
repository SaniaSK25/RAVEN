from pydantic import BaseModel, Field


class TestStep(BaseModel):
    step_number: int = Field(ge=1)
    action: str = Field(min_length=1)
    expected_result: str = Field(min_length=1)


class TestScript(BaseModel):
    preconditions: str = Field(min_length=1)
    steps: list[TestStep] = Field(
        min_length=1,
        description="Numbered test steps; at least one step is required.",
    )


class ScriptPreconditions(BaseModel):
    """Preconditions half of a test script (extracted in its own call)."""

    preconditions: str = Field(min_length=1)


class ScriptSteps(BaseModel):
    """Steps half of a test script (extracted in its own call)."""

    steps: list[TestStep] = Field(
        min_length=1,
        description="Numbered test steps; at least one step is required.",
    )
