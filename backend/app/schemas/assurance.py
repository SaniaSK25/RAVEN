import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import AssuranceLevel


class AssuranceResult(BaseModel):
    level: AssuranceLevel
    generate_test_script: bool
    reason: str


class CSAAssuranceResponse(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    assurance_level: AssuranceLevel
    generate_test_script: bool
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}
