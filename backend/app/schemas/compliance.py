from pydantic import BaseModel


class ComplianceEvaluateRequest(BaseModel):
    """Manual requirement-wording classification request.

    This intentionally does not accept evidence or regulatory clauses. It
    classifies supplied requirements against the five configured control areas.
    """

    requirement_ids: list[str] | None = None


class CompliancePromptRequest(BaseModel):
    requirement_ids: list[str] | None = None
