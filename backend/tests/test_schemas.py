import pytest
from pydantic import ValidationError

from app.schemas.changes import ReanalysisAssessment
from app.schemas.requirements import RequirementCreate
from app.schemas.traceability import ImportPayload, LinkCreate


def test_reanalysis_assessment_preserves_additional_fields():
    assessment = ReanalysisAssessment.model_validate(
        {"severity": 4, "band": "High", "custom": "kept"}
    )

    assert assessment.model_dump(exclude_unset=True) == {
        "severity": 4,
        "band": "High",
        "custom": "kept",
    }


def test_traceability_request_schemas_restrict_supported_values():
    with pytest.raises(ValidationError):
        LinkCreate(
            src_type="unknown",
            src_id="source",
            dst_type="test",
            dst_id="target",
            link_type="verifies",
        )

    with pytest.raises(ValidationError):
        ImportPayload(content="", mode="unsupported")


def test_requirement_schema_rejects_empty_required_fields():
    with pytest.raises(ValidationError):
        RequirementCreate(title="", description="Description")
