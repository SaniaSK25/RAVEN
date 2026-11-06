from pydantic import BaseModel, Field


class RequirementCreate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str = Field(min_length=1)
    text: str | None = None
    req_key: str | None = None
    created_by: str = "api"


class RequirementImportItem(RequirementCreate):
    source_row: int | None = Field(default=None, ge=1)


class RequirementBatchCreate(BaseModel):
    requirements: list[RequirementImportItem] = Field(min_length=1)


class RequirementEdit(BaseModel):
    text: str = Field(min_length=1)
    edited_by: str = "api"
