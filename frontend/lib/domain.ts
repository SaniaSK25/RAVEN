/**
 * RAVEN frontend domain model — the STABLE contract the UI is built against.
 *
 * This deliberately does NOT mirror today's backend shapes one-to-one.
 * The backend is incomplete (see lib/api-types.ts), so the UI depends on
 * these domain types and the adapter layer converts API responses into them.
 * When the backend is corrected, only the adapter changes — not components.
 *
 * Intended model reference: frontend.txt sections 2–3.
 */

/** Lifecycle states a requirement (or version) can be in. */
export type RequirementStatus =
  | "current"
  | "needs-review"
  | "low-confidence"
  | "processing"
  | "completed"
  | "failed"
  | "stale"
  | "superseded"
  | "warning"
  | "missing"
  | "approved";

/** GAMP 5 software categories. */
export type GampCategory =
  | "Category 1"
  | "Category 3"
  | "Category 4"
  | "Category 5";

/** Risk bands from the intended 1–5 / RPN-125 model. */
export type RiskBand = "LOW" | "MEDIUM" | "HIGH";

/** 1–5 factor scores per the intended risk model. */
export interface RiskFactors {
  severity: number;
  probability: number;
  detectability: number;
}

/** A deterministic risk assessment: score + rule trace for auditability. */
export interface RiskAssessment {
  id: string;
  requirementId: string;
  version: number;
  severity: number;
  probability: number;
  detectability: number;
  /** RPN = severity × probability × detectability (1–125). */
  rpn: number;
  band: RiskBand;
  /** Stable rule identifier, e.g. "RISK-001". */
  ruleId: string;
  /** Ordered human-readable rule path, e.g. ["severity>=4", "gxp=true", "→ HIGH"]. */
  decisionPath: string[];
  reasoning: string;
  createdAt: string;
}

/** Assurance outcomes (intended model — four outcomes). */
export type AssuranceOutcome =
  | "scripted"
  | "exploratory"
  | "unscripted-supplier"
  | "unscripted-adhoc";

export interface AssuranceDecision {
  id: string;
  requirementId: string;
  version: number;
  outcome: AssuranceOutcome;
  ruleId: string;
  decisionPath: string[];
  rationale: string;
  /** True only when outcome is "scripted". */
  generateTest: boolean;
  createdAt: string;
}

/** Evidence supporting a requirement, with reviewer confidence. */
export interface Evidence {
  id: string;
  requirementId: string;
  version: number;
  source: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  createdAt: string;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
}

/** Formally generated only for scripted requirements. */
export interface Test {
  id: string;
  requirementId: string;
  version: number;
  preconditions: string;
  steps: TestStep[];
  status: "draft" | "in-review" | "approved";
  createdAt: string;
}

export interface RequirementVersion {
  version: number;
  title: string;
  description: string;
  status: RequirementStatus;
  createdAt: string;
  supersededAt: string | null;
}

/** Core aggregate: one requirement and its current lifecycle state. */
export interface Requirement {
  id: string;
  code: string;
  title: string;
  description: string;
  gampCategory: GampCategory;
  gxpImpact: boolean;
  status: RequirementStatus;
  version: number;
  versions: RequirementVersion[];
  evidence: Evidence[];
  risk: RiskAssessment | null;
  assurance: AssuranceDecision | null;
  tests: Test[];
  updatedAt: string;
}

/** Traceability graph nodes and edges. */
export type TraceNodeType = "requirement" | "risk" | "assurance" | "test";

export interface TraceNode {
  id: string;
  type: TraceNodeType;
  label: string;
  status: RequirementStatus;
}

export type TraceEdgeType =
  | "has_risk"
  | "assessed_as"
  | "mitigated_by"
  | "verifies";

export interface TraceEdge {
  id: string;
  from: string;
  to: string;
  type: TraceEdgeType;
}

export interface Traceability {
  nodes: TraceNode[];
  edges: TraceEdge[];
}

/** A single change event on a requirement. */
export interface ChangeEvent {
  id: string;
  requirementId: string;
  fromVersion: number;
  toVersion: number;
  summary: string;
  impactedIds: string[];
  staleIds: string[];
  status: "pending-review" | "confirmed" | "re-analysed";
  createdAt: string;
}

/** Atomic regulatory criterion and its coverage. */
export type CoverageStatus = "covered" | "partial" | "absent";

export interface ComplianceCriterion {
  id: string;
  code: string;
  title: string;
  status: CoverageStatus;
  requirementIds: string[];
  evidenceIds: string[];
  /** Concrete, named gaps when status is partial/absent. */
  gaps: string[];
}

/** QA roles for permission checks. */
export type QARole = "qa-member" | "qa-leader";
