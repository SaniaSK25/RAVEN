"""Pydantic response models for the HTTP API."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class RequirementVersionResponse(BaseModel):
    version: int
    text: str
    is_current: bool
    created_at: str | None = None


class RequirementResponse(BaseModel):
    id: str
    req_key: str | None
    title: str
    description: str
    status: str
    current_version_id: str | None
    text: str
    version: int
    created_at: str | None
    versions: list[RequirementVersionResponse]


class RequirementRiskResponse(BaseModel):
    id: str
    severity: int | None
    probability: int | None
    detectability: int | None
    rpn: int | float | None
    band: str | None
    freshness: str


class RequirementAssuranceResponse(BaseModel):
    id: str
    level: str
    reason_code: str
    label: str
    method: str
    freshness: str


class RequirementTestResponse(BaseModel):
    id: str
    title: str | None
    origin: str
    freshness: str
    external_code: str | None
    script: str


class TokenUsageSummaryResponse(BaseModel):
    run_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int


class RequirementDetailResponse(RequirementResponse):
    risk: RequirementRiskResponse | None = None
    assurance: RequirementAssuranceResponse | None = None
    tests: list[RequirementTestResponse] = Field(default_factory=list)
    token_usage: TokenUsageSummaryResponse | None = None


class RequirementPageResponse(BaseModel):
    items: list[RequirementResponse]
    total: int
    skip: int
    limit: int


class RequirementChangeImpactResponse(BaseModel):
    risks: list[str]
    assessments: list[str]
    decisions: list[str]
    tests: list[str]
    links: list[str]


class RequirementMutationResponse(BaseModel):
    status: Literal["changed", "unchanged", "deleted"]
    requirement_id: str
    event_id: str | None = None
    impact: RequirementChangeImpactResponse | None = None


class TestResponse(BaseModel):
    id: str
    title: str | None
    origin: str
    freshness: str
    external_code: str | None
    requirement_version_id: str
    assurance_decision_id: str | None
    status: str
    version: int
    script: str
    created_at: str | None
    requirement_id: str
    requirement_key: str | None
    requirement_title: str | None


class ChangeImpactResponse(BaseModel):
    risks: list[str]
    assessments: list[str]
    decisions: list[str]
    tests: list[str]
    links: list[str]


class ChangeEventResponse(BaseModel):
    id: str
    requirement_id: str
    kind: str
    status: str
    impact: ChangeImpactResponse
    diff: dict[str, Any] | None
    baseline_assessment_id: str | None
    carried_from_event_id: str | None
    resolution_note: str | None
    resolved_at: str | None
    created_by: str
    created_at: str | None
    requirement_key: str | None = None
    requirement_title: str | None = None
    current_version: int | None = None
    current_text: str | None = None


class AssuranceDecisionResponse(BaseModel):
    id: str
    risk_assessment_id: str
    requirement_id: str | None
    requirement_key: str | None
    requirement_title: str | None
    requirement_version_id: str | None
    version: int | None
    current_requirement_version: int | None
    is_current_version: bool
    assurance_level: str
    rule_id: str
    rule_version: str
    generate_test: bool
    reasoning: str
    decision_path: Any
    freshness: str
    assessment_freshness: str | None
    severity: int | None
    rpn: int | float | None
    rpn_points: int | float | None
    gxp_impact: bool | None
    gamp_category: int | str | None
    band: str | None
    created_at: str | None


class AssuranceDecisionPageResponse(BaseModel):
    items: list[AssuranceDecisionResponse]
    total: int
    skip: int
    limit: int


class RiskAssessmentResponse(BaseModel):
    id: str
    requirement_id: str | None
    requirement_key: str | None
    requirement_title: str | None
    requirement_version_id: str
    version: int | None
    current_requirement_version: int | None
    is_current_version: bool
    is_current: bool
    status: str
    freshness: str
    severity: int | None
    probability: int | None
    detectability: int | None
    severity_rule_id: str | None
    probability_rule_id: str | None
    detectability_rule_id: str | None
    severity_reasoning: str | None = None
    probability_reasoning: str | None = None
    detectability_reasoning: str | None = None
    severity_decision_path: list[dict[str, Any]] = Field(default_factory=list)
    probability_decision_path: list[dict[str, Any]] = Field(default_factory=list)
    detectability_decision_path: list[dict[str, Any]] = Field(default_factory=list)
    gamp_reason: str | None = None
    rpn: int | float | None
    rpn_points: int | float | None
    band: str | None
    gxp_impact: bool | None
    gamp_category: int | str | None
    rule_version: str | None
    created_at: str | None


class RiskAssessmentPageResponse(BaseModel):
    items: list[RiskAssessmentResponse]
    total: int
    skip: int
    limit: int


class RunAssuranceDecisionResponse(BaseModel):
    id: str
    assurance_level: str
    generate_test: bool
    rule_id: str
    rule_version: str
    reasoning: str
    freshness: str


class RunTestScriptResponse(BaseModel):
    id: str
    script: str
    status: str
    freshness: str


class AssessmentRunResponse(BaseModel):
    requirement_id: str
    requirement_key: str | None
    requirement_version_id: str
    version: int
    risk_assessment: RiskAssessmentResponse
    assurance_decision: RunAssuranceDecisionResponse | None
    test_script: RunTestScriptResponse | None
    token_usage: TokenUsageSummaryResponse


class GenerateScriptResponse(BaseModel):
    requirement_id: str
    requirement_key: str | None
    requirement_version_id: str
    test_script: RunTestScriptResponse
    token_usage: TokenUsageSummaryResponse


class TraceLinkResponse(BaseModel):
    id: str
    src_type: str
    src_id: str
    dst_type: str
    dst_id: str
    link_type: str
    origin: str
    active: bool
    suppressed: bool
    stale: bool
    created_by: str


class TraceMatrixRowResponse(BaseModel):
    requirement_id: str
    requirement_version: int | str
    risk_id: str
    severity: int | str
    probability: int | str
    detectability: int | str
    rpn: int | float | str
    band: str
    assurance_level: str
    assurance_label: str
    reason_code: str
    test_id: str
    test_title: str
    test_origin: str
    coverage_status: str
    stale: bool
    orphan_flags: str


class TraceMatrixResponse(BaseModel):
    columns: list[str]
    rows: list[TraceMatrixRowResponse]
    total: int


class TraceGraphNodeMetaResponse(BaseModel):
    version: int | str | None = None
    status: str | None = None
    change_pending: bool | None = None
    severity: int | None = None
    probability: int | None = None
    detectability: int | None = None
    rpn: int | float | None = None
    band: str | None = None
    level: str | None = None
    reason_code: str | None = None
    method: str | None = None
    title: str | None = None
    origin: str | None = None
    test_type: str | None = None


class TraceGraphNodeResponse(BaseModel):
    id: str
    type: Literal["requirement", "risk", "assurance", "test"]
    label: str
    stale: bool
    orphan: bool
    meta: TraceGraphNodeMetaResponse


class TraceGraphEdgeResponse(BaseModel):
    id: str
    source: str
    target: str
    type: str
    origin: str
    active: bool
    stale: bool
    suppressed: bool


class TraceGraphSummaryResponse(BaseModel):
    nodes: int
    edges: int
    stale_nodes: int
    stale_edges: int
    orphan_nodes: int


class TraceGraphResponse(BaseModel):
    nodes: list[TraceGraphNodeResponse]
    edges: list[TraceGraphEdgeResponse]
    summary: TraceGraphSummaryResponse


class OrphanResponse(BaseModel):
    type: str
    entity_type: str
    entity_id: str
    entity_key: str
    reason: str
    detail: str


class OrphanSummaryResponse(BaseModel):
    O1: int
    O2: int
    O3: int
    total: int


class OrphansResponse(BaseModel):
    orphans: list[OrphanResponse]
    summary: OrphanSummaryResponse


class ImportSummaryResponse(BaseModel):
    mode: str
    links_created: int
    links_reactivated: int
    tests_created: int
    requirement_only: int
    test_unlinked: int
    warnings: list[str]


class LinkRebuildResponse(BaseModel):
    links_created: int
    links_reactivated: int
    links_deactivated: int
    links_total: int


class DatabaseStatusResponse(BaseModel):
    database: Literal["connected"]
    result: int
