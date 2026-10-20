from typing import Literal

from pydantic import BaseModel, Field

TraceNodeType = Literal["requirement", "risk", "assurance", "test"]
TraceLinkType = Literal["has_risk", "assessed_as", "mitigated_by", "verifies"]
ImportMode = Literal["merge", "replace_imported"]


class LinkCreate(BaseModel):
    src_type: TraceNodeType
    src_id: str = Field(min_length=1)
    dst_type: TraceNodeType
    dst_id: str = Field(min_length=1)
    link_type: TraceLinkType
    created_by: str = "api"


class ImportPayload(BaseModel):
    content: str
    mode: ImportMode = "merge"
    created_by: str = "api"
