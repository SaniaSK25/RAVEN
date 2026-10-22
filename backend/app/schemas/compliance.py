from pydantic import BaseModel


class ComplianceEvaluateRequest(BaseModel):
    """Requirements-only Annex 11 review request.

    This intentionally does not accept evidence: the current RAVEN workflow
    assesses whether the supplied requirement set asks for the right controls.
    """

    requirement_ids: list[str] | None = None


class CompliancePromptRequest(BaseModel):
    requirement_ids: list[str] | None = None
