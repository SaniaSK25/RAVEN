from pydantic import BaseModel, ConfigDict, Field, field_validator


class BatchAssessmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requirement_ids: list[str] = Field(min_length=1, max_length=10)

    @field_validator("requirement_ids")
    @classmethod
    def ids_must_be_unique(cls, value: list[str]) -> list[str]:
        normalized = [item.strip() for item in value]
        if any(not item for item in normalized):
            raise ValueError("Requirement identifiers must not be blank.")
        if len(set(normalized)) != len(normalized):
            raise ValueError("Requirement identifiers must be unique.")
        return normalized
