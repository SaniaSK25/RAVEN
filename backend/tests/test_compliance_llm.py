"""Tests for manual, batched requirement classification."""

import json

import pytest
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, LLMResult

import app.services.compliance_llm as classifier
from app.services.compliance_llm import (
    CONTROL_AREAS,
    ClassificationError,
    run_classification,
    validate_batch_response,
)


def _requirements(count):
    return [
        {"key": f"REQ-{index + 1:03}", "text": f"Requirement text {index + 1}"}
        for index in range(count)
    ]


def _payload(messages):
    return json.loads(messages[1].content)


def _empty_response(payload):
    return {
        area: {"fully_covered": [], "partially_covered": []}
        for area in payload["control_areas"]
    }


class _FakeBedrock:
    model_id = "anthropic.claude-3-test"

    def __init__(self, respond):
        self.respond = respond
        self.calls = []

    def invoke(self, messages, config):
        payload = _payload(messages)
        self.calls.append(payload)
        response = self.respond(payload, len(self.calls))
        if isinstance(response, Exception):
            raise response
        content = response if isinstance(response, str) else json.dumps(response)
        for callback in config["callbacks"]:
            callback.on_llm_end(
                LLMResult(
                    generations=[
                        [
                            ChatGeneration(
                                message=AIMessage(
                                    content=content,
                                    usage_metadata={
                                        "input_tokens": 40,
                                        "output_tokens": 10,
                                        "total_tokens": 50,
                                    },
                                )
                            )
                        ]
                    ],
                    llm_output={},
                )
            )
        return AIMessage(content=content)


def _mock_model(monkeypatch, respond):
    fake = _FakeBedrock(respond)
    limits = []

    def get_model(**kwargs):
        limits.append(kwargs)
        return fake

    monkeypatch.setattr(classifier, "get_llm", get_model)
    monkeypatch.setattr(classifier, "configured_model_id", lambda: fake.model_id)
    return fake, limits


def _full_for(payload, area="audit_trail", key=None):
    response = _empty_response(payload)
    requirement_key = key or payload["requirements"][0]["key"]
    response[area]["fully_covered"].append(requirement_key)
    return response


def test_one_fully_covered_requirement_makes_area_covered(monkeypatch):
    _mock_model(monkeypatch, lambda payload, _: _full_for(payload))
    result = run_classification(_requirements(1))
    audit = result["control_areas"]["audit_trail"]
    assert audit["verdict"] == "COVERED"
    assert audit["fully_covered_requirements"] == ["REQ-001"]


def test_partial_match_remains_partial_after_all_batches(monkeypatch):
    def partial(payload, _):
        response = _empty_response(payload)
        response["e_signature"]["partially_covered"] = ["REQ-001"]
        return response

    _mock_model(monkeypatch, partial)
    result = run_classification(_requirements(1))
    signature = result["control_areas"]["e_signature"]
    assert signature["verdict"] == "PARTIALLY_COVERED"
    assert signature["partially_covered_requirements"] == ["REQ-001"]


def test_no_matches_after_batches_is_absent(monkeypatch):
    _mock_model(monkeypatch, lambda payload, _: _empty_response(payload))
    result = run_classification(_requirements(2), max_requirements_per_batch=1)
    assert result["control_areas"]["audit_trail"]["verdict"] == "ABSENT"
    assert result["token_usage"]["total_batches"] == 2


def test_full_match_in_batch_two_removes_area_from_batch_three(monkeypatch):
    def respond(payload, call_number):
        response = _empty_response(payload)
        if call_number == 2:
            response["audit_trail"]["fully_covered"] = ["REQ-002"]
        return response

    fake, _ = _mock_model(monkeypatch, respond)
    result = run_classification(_requirements(3), max_requirements_per_batch=1)
    assert len(fake.calls) == 3
    assert "audit_trail" in fake.calls[0]["control_areas"]
    assert "audit_trail" in fake.calls[1]["control_areas"]
    assert "audit_trail" not in fake.calls[2]["control_areas"]
    assert result["control_areas"]["audit_trail"]["fully_covered_requirements"] == [
        "REQ-002"
    ]


def test_multiple_partial_matches_never_combine_to_covered(monkeypatch):
    def partial(payload, _):
        response = _empty_response(payload)
        response["access_control"]["partially_covered"] = [
            item["key"] for item in payload["requirements"]
        ]
        return response

    _mock_model(monkeypatch, partial)
    result = run_classification(_requirements(2), max_requirements_per_batch=1)
    access = result["control_areas"]["access_control"]
    assert access["verdict"] == "PARTIALLY_COVERED"
    assert access["fully_covered_requirements"] == []
    assert access["partially_covered_requirements"] == ["REQ-001", "REQ-002"]


def test_requirement_can_match_multiple_areas(monkeypatch):
    def respond(payload, _):
        response = _empty_response(payload)
        for area in ("audit_trail", "data_integrity"):
            response[area]["fully_covered"] = ["REQ-001"]
        return response

    _mock_model(monkeypatch, respond)
    result = run_classification(_requirements(1))
    assert result["control_areas"]["audit_trail"]["verdict"] == "COVERED"
    assert result["control_areas"]["data_integrity"]["verdict"] == "COVERED"


def test_all_areas_covered_stops_remaining_batches(monkeypatch):
    def respond(payload, _):
        response = _empty_response(payload)
        for area in payload["control_areas"]:
            response[area]["fully_covered"] = ["REQ-001"]
        return response

    fake, _ = _mock_model(monkeypatch, respond)
    result = run_classification(_requirements(10), max_requirements_per_batch=1)
    assert len(fake.calls) == 1
    assert all(
        area["verdict"] == "COVERED" for area in result["control_areas"].values()
    )


def test_unrelated_requirements_are_not_forced_into_matches(monkeypatch):
    _mock_model(monkeypatch, lambda payload, _: _empty_response(payload))
    result = run_classification(_requirements(1))
    assert all(
        not area["fully_covered_requirements"]
        and not area["partially_covered_requirements"]
        for area in result["control_areas"].values()
    )


def test_unknown_requirement_keys_are_rejected():
    response = {
        area: {"fully_covered": [], "partially_covered": []} for area in CONTROL_AREAS
    }
    response["audit_trail"]["fully_covered"] = ["REQ-999"]
    with pytest.raises(ClassificationError, match="unknown requirement keys"):
        validate_batch_response(response, _requirements(1), list(CONTROL_AREAS))


def test_unknown_areas_duplicates_and_cross_category_duplicates_are_rejected():
    requirement = _requirements(1)
    with pytest.raises(ClassificationError, match="Unknown control areas"):
        validate_batch_response(
            {"invented": {"fully_covered": [], "partially_covered": []}},
            requirement,
            ["audit_trail"],
        )
    response = {
        "audit_trail": {
            "fully_covered": ["REQ-001"],
            "partially_covered": ["REQ-001"],
        }
    }
    with pytest.raises(ClassificationError, match="duplicate"):
        validate_batch_response(response, requirement, ["audit_trail"])


def test_invalid_or_truncated_json_fails_the_batch_without_absent_result(monkeypatch):
    fake, _ = _mock_model(monkeypatch, lambda _payload, _: '{"audit_trail":')
    invocations = []
    with pytest.raises(ClassificationError, match="invalid or truncated JSON"):
        run_classification(
            _requirements(1),
            on_invocation=invocations.append,
        )
    assert len(fake.calls) == 1
    assert invocations[0]["status"] == "FAILED"
    assert invocations[0]["actual_input_tokens"] == 40


def test_token_usage_accumulates_and_keeps_estimates_distinct(monkeypatch):
    _mock_model(monkeypatch, lambda payload, _: _empty_response(payload))
    result = run_classification(_requirements(2), max_requirements_per_batch=1)
    usage = result["token_usage"]
    assert usage["total_batches"] == 2
    assert usage["estimated_input_tokens"] > 0
    assert usage["actual_input_tokens"] == 80
    assert usage["actual_output_tokens"] == 20
    assert usage["total_actual_tokens"] == 100
    assert usage["actual_usage_complete"] is True
    assert all("actual_input_tokens" in row for row in result["batch_usage"])


def test_output_limit_is_passed_to_bedrock_invocation_factory(monkeypatch):
    _, limits = _mock_model(monkeypatch, lambda payload, _: _empty_response(payload))
    run_classification(_requirements(1), max_output_tokens=123)
    assert limits == [{"max_tokens": 123}]


def test_token_estimator_includes_system_prompt_and_control_definitions():
    short_messages = classifier.build_messages(_requirements(1), ["audit_trail"])
    all_area_messages = classifier.build_messages(_requirements(1), list(CONTROL_AREAS))
    short = classifier.estimate_input_tokens("anthropic.claude-test", short_messages)
    all_areas = classifier.estimate_input_tokens(
        "anthropic.claude-test", all_area_messages
    )
    assert all_areas > short > 0


def test_duplicate_requirement_keys_are_rejected_before_llm(monkeypatch):
    fake, _ = _mock_model(monkeypatch, lambda payload, _: _empty_response(payload))
    with pytest.raises(ValueError, match="Duplicate requirement keys"):
        run_classification([_requirements(1)[0], _requirements(1)[0]])
    assert fake.calls == []


def test_api_queues_run_without_running_model_and_persists_batch_usage(monkeypatch):
    import hashlib

    from fastapi import BackgroundTasks
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.api.v1.endpoints import compliance as compliance_api
    from app.db.base import Base
    from app.models.compliance_assessment_run import ComplianceAssessmentRun
    from app.models.compliance_batch_usage import ComplianceBatchUsage
    from app.models.enums import RequirementStatus
    from app.models.requirement import Requirement
    from app.models.requirement_version import RequirementVersion
    from app.schemas.compliance import ComplianceEvaluateRequest

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    text = "The system records a sample user action."
    requirement = Requirement(
        req_key="REQ-API-001",
        title="Sample requirement",
        description=text,
        status=RequirementStatus.APPROVED,
        created_by="test",
    )
    session.add(requirement)
    session.flush()
    version = RequirementVersion(
        requirement_id=requirement.id,
        version_number=1,
        text=text,
        hash_sha256=hashlib.sha256(text.encode()).hexdigest(),
        is_current=True,
    )
    session.add(version)
    session.flush()
    requirement.current_version_id = version.id
    session.commit()

    monkeypatch.setattr(classifier, "configured_model_id", lambda: "fake-model")
    monkeypatch.setattr(
        classifier,
        "run_classification",
        lambda *_args, **_kwargs: pytest.fail("The request must only queue the run."),
    )
    background_tasks = BackgroundTasks()
    queued = compliance_api.evaluate(
        ComplianceEvaluateRequest(),
        background_tasks,
        session,
    )
    assert queued["assessment_status"] == "QUEUED"
    assert len(background_tasks.tasks) == 1
    assert session.query(ComplianceAssessmentRun).count() == 1
    assert session.query(ComplianceBatchUsage).count() == 0

    run = session.query(ComplianceAssessmentRun).one()
    run.requirement_snapshot = json.dumps(
        [
            {
                "key": "REQ-API-001",
                "id": "requirement-uuid-1",
                "text": "Audit events are recorded.",
            }
        ]
    )
    batch = ComplianceBatchUsage(
        assessment=run,
        batch_number=1,
        attempt=1,
        requirements_processed=1,
        estimated_input_tokens=90,
        actual_input_tokens=40,
        actual_output_tokens=None,
        model_id="fake-model",
        max_output_tokens=256,
        status="COMPLETED",
    )
    session.add(batch)
    run.status = "RUNNING"
    session.commit()

    serialized = compliance_api._serialize_run(run)
    assert serialized["assessment_status"] == "RUNNING"
    assert serialized["control_areas"] is None
    assert serialized["token_usage"]["estimated_input_tokens"] == 90
    assert serialized["token_usage"]["actual_input_tokens"] is None
    assert serialized["token_usage"]["actual_output_tokens"] is None
    assert serialized["token_usage"]["total_actual_tokens"] is None
    assert serialized["batch_usage"][0]["max_output_tokens"] == 256

    run.status = "COMPLETED"
    run.result = json.dumps(
        {
            "assessment_status": "COMPLETED",
            "control_areas": {
                "audit_trail": {
                    "verdict": "COVERED",
                    "fully_covered_requirements": ["REQ-API-001"],
                    "partially_covered_requirements": [],
                }
            },
            "requirements_count": 1,
            "matching_lists_exhaustive": False,
            "token_usage": {
                "total_batches": 1,
                "estimated_input_tokens": 90,
                "actual_input_tokens": 40,
                "actual_output_tokens": 10,
                "total_actual_tokens": 50,
                "actual_usage_complete": True,
            },
        }
    )
    session.commit()
    completed = compliance_api._serialize_run(run)
    assert completed["assessment_status"] == "COMPLETED"
    assert completed["control_areas"]["audit_trail"]["verdict"] == "COVERED"
    assert completed["requirement_routes"] == {"REQ-API-001": "requirement-uuid-1"}
    assert completed["token_usage"]["total_actual_tokens"] == 50
    session.close()
