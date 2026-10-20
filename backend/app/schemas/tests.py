from pydantic import BaseModel, Field


class ManualTestCreate(BaseModel):
    title: str = Field(min_length=1)
    requirement_id: str = Field(min_length=1)
    text: str | None = None
    test_type: str = "manual"
    created_by: str = "api"
