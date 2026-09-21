import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import RequirementStatus


class RequirementCreate(BaseModel):
    requirement_code: str = Field(..., min_length=1, max_length=50, examples=["CSA-001"])
    title: str = Field(..., min_length=1, max_length=255, examples=["Fire Safety System"])
    description: str = Field(
        ..., min_length=1, examples=["The system must detect smoke within 30 seconds"]
    )
    source_document: str | None = Field(None, max_length=255, examples=["IEC 61508"])
    status: RequirementStatus = Field(default=RequirementStatus.DRAFT)


class RequirementUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, min_length=1)
    source_document: str | None = Field(None, max_length=255)
    status: RequirementStatus | None = None


class RequirementResponse(BaseModel):
    id: uuid.UUID
    requirement_code: str
    title: str
    description: str
    source_document: str | None
    status: RequirementStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedRequirements(BaseModel):
    items: list[RequirementResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
