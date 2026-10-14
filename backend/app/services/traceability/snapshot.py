"""In-memory snapshot the pure traceability functions operate on.

Mirrors the TRACEABILITY MATRIX spec graph model (section 1) while
adapting node identity to RAVEN's UUID primary keys:

- requirement node  <-> ``Requirement`` (+ current ``RequirementVersion``)
- risk node         <-> ``RiskAssessment`` (one Layer-3 analysis)
- assurance node    <-> ``AssuranceDecision`` (one verdict)
- test node         <-> ``TestScript`` (generated, manual or imported)
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class RequirementInfo:
    """One requirement node."""

    id: str
    req_key: str
    version: int = 1
    status: str = "active"  # "active" | "deleted"


@dataclass(frozen=True)
class RiskInfo:
    """One risk node (a Layer-3 analysis of a requirement version)."""

    id: str
    requirement_id: str
    requirement_version_id: str = ""
    freshness: str = "fresh"  # "fresh" | "stale" | "superseded"
    is_current_version: bool = True
    severity: int | None = None
    probability: int | None = None
    detectability: int | None = None
    rpn: float | int | None = None
    band: str | None = None  # "Low" | "Medium" | "High"


@dataclass(frozen=True)
class AssessmentInfo:
    """Join row between a risk and its assurance decision(s)."""

    id: str
    risk_id: str
    freshness: str = "fresh"


@dataclass(frozen=True)
class DecisionInfo:
    """One assurance node."""

    id: str
    assessment_id: str
    risk_id: str
    freshness: str = "fresh"
    level: str = "unscripted"  # "scripted" | "exploratory" | "unscripted"
    reason_code: str = ""
    label: str = ""
    method: str = ""


@dataclass(frozen=True)
class TestInfo:
    """One test node."""

    __test__ = False  # not a pytest test class despite the name

    id: str
    origin: str = "generated"  # "generated" | "manual" | "imported"
    freshness: str = "fresh"
    title: str = ""
    external_code: str | None = None
    test_type: str = ""
    requirement_version_id: str = ""
    decision_id: str | None = None
    risk_id: str | None = None


@dataclass(frozen=True)
class LinkInfo:
    """One stored trace link (any origin)."""

    id: str
    src_type: str
    src_id: str
    dst_type: str
    dst_id: str
    link_type: str  # "has_risk" | "assessed_as" | "mitigated_by" | "verifies"
    origin: str = "system"
    active: bool = True
    suppressed: bool = False
    stale: bool = False


@dataclass(frozen=True)
class DesiredLink:
    """One system link the derivation wants to exist."""

    src_type: str
    src_id: str
    dst_type: str
    dst_id: str
    link_type: str

    def key(self) -> tuple[str, str, str, str, str]:
        return (self.src_type, self.src_id, self.dst_type, self.dst_id, self.link_type)


@dataclass
class TraceSnapshot:
    """Everything the pure functions may read. No DB access inside."""

    requirements: dict[str, RequirementInfo] = field(default_factory=dict)
    risks: dict[str, RiskInfo] = field(default_factory=dict)
    assessments: dict[str, AssessmentInfo] = field(default_factory=dict)
    decisions: dict[str, DecisionInfo] = field(default_factory=dict)
    tests: dict[str, TestInfo] = field(default_factory=dict)
    links: list[LinkInfo] = field(default_factory=list)
    # Requirement ids with an open/reanalyzed change event (matrix stale flag).
    open_change_requirement_ids: set[str] = field(default_factory=set)
