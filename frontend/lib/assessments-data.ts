/** Assessment workspace record type and retained legacy sample-data adapter. */

import type { RiskBand } from "@/lib/domain";
import { getRequirementDetail } from "@/lib/requirement-detail-data";
import { getRequirementsDemoData } from "@/lib/requirements-data";

export type { RiskBand };

export type AssessmentFreshness = "fresh" | "stale";

export interface AssessmentDecisionStep {
  check?: string;
  result?: string | boolean;
  evidence?: string;
  confidence?: number | null;
  points?: number;
  weight?: number;
  weighted?: number;
  sum?: number;
  mapped?: number;
  mapped_score?: number;
  gamp_category?: number;
  gamp_modifier?: number;
  controls_floor?: number | null;
  floor_applied?: boolean;
  final_score?: number;
  [key: string]: unknown;
}

export interface AssessmentRecord {
  assessmentId: string;
  requirementId: string;
  /** Requirement text/title — the main visual focus in the table. */
  title: string;
  /** 1–5 factor scores, displayed as supplied. */
  severity: number | null;
  probability: number | null;
  detectability: number | null;
  severityReasoning: string | null;
  probabilityReasoning: string | null;
  detectabilityReasoning: string | null;
  severityRuleId: string | null;
  probabilityRuleId: string | null;
  detectabilityRuleId: string | null;
  severityDecisionPath: AssessmentDecisionStep[];
  probabilityDecisionPath: AssessmentDecisionStep[];
  detectabilityDecisionPath: AssessmentDecisionStep[];
  gampReason: string | null;
  rpnPoints: number | null;
  /** RPN value supplied by the backend; the UI does not recompute it. */
  rpn: number | null;
  band: RiskBand | null;
  /** Fresh when assessed against the current requirement version, otherwise stale. */
  status: AssessmentFreshness;
  /** Version the assessment was performed against. */
  assessedVersion: string;
  /** Current requirement version (differs when stale). */
  currentVersion: string;
  /** Stable rule identifier of the recorded decision. */
  ruleId: string;
  ruleVersion: string | null;
}

export type AssessmentSortKey = "id" | "rpn" | "severity" | "probability" | "detectability";
export type AssessmentSortDir = "asc" | "desc";

export function getAssessmentsDemoData(): AssessmentRecord[] {
  return getRequirementsDemoData().map((item) => {
    const detail = getRequirementDetail(item.id);
    const risk = detail?.riskDetail;
    const stale = item.status === "stale" || item.status === "warning";
    return {
      assessmentId: item.id,
      requirementId: item.id,
      title: item.title,
      severity: risk?.severity ?? 0,
      probability: risk?.probability ?? 0,
      detectability: risk?.detectability ?? 0,
      severityReasoning: null,
      probabilityReasoning: null,
      detectabilityReasoning: null,
      severityRuleId: null,
      probabilityRuleId: null,
      detectabilityRuleId: null,
      severityDecisionPath: [],
      probabilityDecisionPath: [],
      detectabilityDecisionPath: [],
      gampReason: null,
      rpnPoints: null,
      rpn: item.rpn,
      band: item.risk,
      status: stale ? "stale" : "fresh",
      assessedVersion: stale ? "v1.0" : item.version,
      currentVersion: item.version,
      ruleId: risk?.ruleId ?? "RISK-000",
      ruleVersion: null,
    };
  });
}

export const isAssessmentsDemoData = true;
