from pydantic import BaseModel, Field


class RequirementCreate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str = Field(min_length=1)
    text: str | None = None
    req_key: str | None = None
    created_by: str = "api"


class RequirementEdit(BaseModel):
    text: str = Field(min_length=1)
    edited_by: str = "api"
