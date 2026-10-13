/** Assurance workspace record type and retained legacy sample-data adapter. */

import type {
  AssuranceOutcome,
  RequirementStatus,
  RiskBand,
} from "@/lib/domain";
import { getRequirementDetail } from "@/lib/requirement-detail-data";
import { getRequirementsDemoData } from "@/lib/requirements-data";

export type { AssuranceOutcome, RequirementStatus, RiskBand };

export interface AssuranceRecord {
  decisionId: string;
  requirementId: string;
  /** Requirement text/title — the main visual focus in the table. */
  title: string;
  band: RiskBand | null;
  rpn: number | null;
  severity: number | null;
  gxpImpact: boolean | null;
  /** As recorded, e.g. "Category 5". */
  gampCategory: string | null;
  outcome: AssuranceOutcome;
  /** Concise display phrasing of the recorded outcome (not a decision). */
  reason: string;
  /** Stable rule identifier of the recorded decision. */
  ruleId: string;
  /** Matched conditions of the recorded decision, shown only when expanded. */
  decisionPath: string[];
  /** Human-readable rationale of the recorded decision. */
  rationale: string;
  /** Only current | needs-review | stale are used (see header note). */
  status: RequirementStatus;
  /** Version the decision was recorded against. */
  assessedVersion: string;
  /** Current requirement version (differs when stale). */
  currentVersion: string;
}

export type AssuranceSortKey = "id" | "rpn" | "assurance";
export type AssuranceSortDir = "asc" | "desc";

/** Significance order for assurance sorting (not alphabetical). */
const OUTCOME_RANK: Record<AssuranceOutcome, number> = {
  scripted: 0,
  exploratory: 1,
  unscripted: 2,
  "unscripted-supplier": 3,
  "unscripted-adhoc": 4,
};

export function compareAssurance(a: AssuranceOutcome, b: AssuranceOutcome): number {
  return OUTCOME_RANK[a] - OUTCOME_RANK[b];
}

function toDecisionStatus(status: RequirementStatus): RequirementStatus {
  if (status === "needs-review") return "needs-review";
  if (status === "stale" || status === "warning") return "stale";
  return "current";
}

/** Concise phrasing of an already-recorded outcome (display only). */
function conciseReason(
  outcome: AssuranceOutcome,
  severity: number,
  band: RiskBand,
  gxpImpact: boolean,
  gampCategory: string,
): string {
  switch (outcome) {
    case "scripted":
      return gxpImpact
        ? `Severity ${severity} + GxP impact → Scripted`
        : `Severity ${severity} + ${band} risk → Scripted`;
    case "exploratory": {
      const bandLabel = band.charAt(0) + band.slice(1).toLowerCase();
      return `${bandLabel} risk → Exploratory`;
    }
    case "unscripted-supplier":
      return `Low risk + ${gampCategory} → Supplier Assurance`;
    default:
      return "Low risk → Unscripted";
  }
}

/** Reassurance copy for valid non-scripted outcomes (not missing work). */
export function nonScriptedNote(outcome: AssuranceOutcome): string | null {
  if (outcome === "unscripted") {
    return "No formally scripted test generation is required by this decision.";
  }
  if (outcome === "unscripted-supplier") {
    return "No formal scripted test required; assurance is provided through supplier evidence.";
  }
  if (outcome === "unscripted-adhoc") {
    return "No formal scripted test required; ad hoc verification is appropriate.";
  }
  return null;
}

export function getAssuranceDemoData(): AssuranceRecord[] {
  return getRequirementsDemoData().map((item) => {
    const detail = getRequirementDetail(item.id);
    const assurance = detail?.assuranceDetail;
    const outcome: AssuranceOutcome = assurance?.outcome ?? item.assurance;
    const severity = detail?.riskDetail.severity ?? 0;
    const gxpImpact = detail?.gxpImpact ?? false;
    const gampCategory = detail?.gampCategory ?? "Category 3";
    const stale = item.status === "stale" || item.status === "warning";
    return {
      decisionId: item.id,
      requirementId: item.id,
      title: item.title,
      band: item.risk,
      rpn: item.rpn,
      severity,
      gxpImpact,
      gampCategory,
      outcome,
      reason: conciseReason(outcome, severity, item.risk, gxpImpact, gampCategory),
      ruleId: assurance?.ruleId ?? "ASSURE-000",
      decisionPath: assurance?.decisionPath ?? [],
      rationale: assurance?.rationale ?? "",
      status: toDecisionStatus(item.status),
      assessedVersion: stale ? "v1.0" : item.version,
      currentVersion: item.version,
    };
  });
}

export const isAssuranceDemoData = true;
