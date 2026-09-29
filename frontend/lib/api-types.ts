/**
 * Backend TRANSPORT types + adapters.
 *
 * These mirror what the backend actually returns TODAY (incomplete shapes
 * from RAVEN/backend). The UI must never import these directly — components
 * depend on lib/domain.ts, and the functions below convert transport → domain.
 *
 * Mismatch handling (frontend.txt §6 — do not silently design around these):
 *
 * 1. Risk model: intended 1–5 factors / RPN ≤125, but rule_engine.py uses a
 *    smaller scheme (severity 1/2/4/5, probability 1–3, detectability 1–3,
 *    HIGH ≥16). → ADAPTER: normalize current scores into the domain shape
 *    and mark provenance; REQUIRE BACKEND CORRECTION to the 1–5/RPN model.
 * 2. Assurance: frontend domain has 4 outcomes incl. "unscripted-supplier",
 *    backend only knows scripted/exploratory/unscripted. → ADAPTER: map
 *    bare "unscripted" to "unscripted-adhoc"; REQUIRE BACKEND CORRECTION to
 *    emit the supplier-leverage distinction.
 * 3. ORM vs Pydantic drift (db_models.py broken, types disagree). → FRONTEND
 *    DECOUPLED via these transport types; REQUIRE BACKEND CORRECTION.
 * 4. No API routes yet (main.py / api/ empty). → TEMPORARILY ADAPT: feature
 *    modules serve demo/empty data until endpoints exist; adapter is ready.
 * 5. Bedrock model/region empty; decider invoke-signature bug; TestScript
 *    truncated (no steps list). → BACKEND CORRECTION; frontend Test type is
 *    already complete and adapter tolerates missing `steps`.
 */

import type {
  AssuranceDecision,
  AssuranceOutcome,
  CoverageStatus,
  RiskAssessment,
  RiskBand,
  Test,
} from "@/lib/domain";

/* ---------- Today's backend payloads (as implemented, not as intended) --- */

export interface BackendRiskResult {
  severity_score: number;
  probability_score: number;
  detectability_score: number;
  total_risk_score: number;
  risk_band: "HIGH" | "MEDIUM" | "LOW";
}

export interface BackendAssuranceDecision {
  assurance_level: "unscripted" | "exploratory" | "scripted";
  rationale: string;
  generate_test: boolean;
}

export interface BackendTestScript {
  preconditions: string;
  steps?: Array<{
    step_number: number;
    action: string;
    expected_result: string;
  }>;
}

export interface BackendRequirement {
  id: string;
  requirement_code: string;
  title: string;
  description: string;
  gamp_category: string;
  gamp_rationale: string;
  gxp_impact: string;
  gxp_rationale: string;
  severity_fact: string;
  probability_fact: string;
  detectability_fact: string;
  version: number;
  is_stale: boolean;
}

/* ------------------------------- Adapters -------------------------------- */

function toBand(band: BackendRiskResult["risk_band"]): RiskBand {
  switch (band) {
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

/**
 * Normalizes today's smaller risk scores into the domain RiskAssessment.
 * `provenance: "legacy-scale"` marks values computed under the current
 * backend scheme so the UI can avoid overstating precision until the
 * backend moves to the intended 1–5 / RPN-125 model.
 */
export function adaptRisk(
  result: BackendRiskResult,
  requirementId: string,
  version: number,
): RiskAssessment & { provenance: "legacy-scale" } {
  return {
    id: `risk-${requirementId}-v${version}`,
    requirementId,
    version,
    severity: result.severity_score,
    probability: result.probability_score,
    detectability: result.detectability_score,
    rpn: result.total_risk_score,
    band: toBand(result.risk_band),
    ruleId: "RISK-LEGACY-001",
    decisionPath: [
      `severity=${result.severity_score}`,
      `probability=${result.probability_score}`,
      `detectability=${result.detectability_score}`,
      `total=${result.total_risk_score} → ${result.risk_band}`,
    ],
    reasoning:
      "Computed with the current backend scoring scheme (legacy scale). " +
      "Pending backend migration to the intended 1–5 / RPN-125 model.",
    createdAt: new Date().toISOString(),
    provenance: "legacy-scale",
  };
}

/** Maps today's 3-level backend outcome to the 4-outcome domain model. */
export function adaptAssuranceOutcome(
  level: BackendAssuranceDecision["assurance_level"],
): AssuranceOutcome {
  if (level === "scripted") return "scripted";
  if (level === "exploratory") return "exploratory";
  // Backend does not yet distinguish supplier leverage from ad hoc.
  return "unscripted-adhoc";
}

export function adaptAssurance(
  decision: BackendAssuranceDecision,
  requirementId: string,
  version: number,
): AssuranceDecision {
  const outcome = adaptAssuranceOutcome(decision.assurance_level);
  return {
    id: `assurance-${requirementId}-v${version}`,
    requirementId,
    version,
    outcome,
    ruleId:
      outcome === "scripted" ? "ASSURE-001" : "ASSURE-LEGACY-002",
    decisionPath: [
      `assurance_level=${decision.assurance_level}`,
      `→ ${outcome}`,
    ],
    rationale: decision.rationale,
    generateTest: decision.generate_test && outcome === "scripted",
    createdAt: new Date().toISOString(),
  };
}

/** Tolerates the truncated TestScript schema (missing `steps`). */
export function adaptTest(
  script: BackendTestScript,
  requirementId: string,
  version: number,
): Test {
  return {
    id: `test-${requirementId}-v${version}`,
    requirementId,
    version,
    preconditions: script.preconditions,
    steps: (script.steps ?? []).map((s) => ({
      stepNumber: s.step_number,
      action: s.action,
      expectedResult: s.expected_result,
    })),
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

/** Pass-through for coverage values, which already match the domain. */
export function adaptCoverage(
  status: string,
): CoverageStatus {
  if (status === "covered" || status === "partial" || status === "absent") {
    return status;
  }
  return "absent";
}
