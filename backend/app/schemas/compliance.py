from pydantic import BaseModel


class ComplianceEvaluateRequest(BaseModel):
    """Requirement-wording classification request.

    This intentionally does not accept evidence or regulatory clauses. It
    classifies supplied requirements against the five configured control areas.
    Requirement edits also trigger classification automatically.
    """

    requirement_ids: list[str] | None = None


class CompliancePromptRequest(BaseModel):
    requirement_ids: list[str] | None = None
