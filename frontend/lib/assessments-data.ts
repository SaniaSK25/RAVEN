/** Assessment workspace record type and retained legacy sample-data adapter. */

import type { RequirementStatus, RiskBand } from "@/lib/domain";
import { getRequirementDetail } from "@/lib/requirement-detail-data";
import { getRequirementsDemoData } from "@/lib/requirements-data";

export type { RequirementStatus, RiskBand };

export interface AssessmentRecord {
  assessmentId: string;
  requirementId: string;
  /** Requirement text/title — the main visual focus in the table. */
  title: string;
  /** 1–5 factor scores, displayed as supplied. */
  severity: number | null;
  probability: number | null;
  detectability: number | null;
  /** RPN value supplied by the backend; the UI does not recompute it. */
  rpn: number | null;
  band: RiskBand | null;
  /** Only current | needs-review | stale are used (see header note). */
  status: RequirementStatus;
  /** Version the assessment was performed against. */
  assessedVersion: string;
  /** Current requirement version (differs when stale). */
  currentVersion: string;
  /** Stable rule identifier of the recorded decision. */
  ruleId: string;
}

export type AssessmentSortKey = "id" | "rpn" | "severity" | "probability" | "detectability";
export type AssessmentSortDir = "asc" | "desc";

function toAssessmentStatus(status: RequirementStatus): RequirementStatus {
  if (status === "needs-review") return "needs-review";
  if (status === "stale" || status === "warning") return "stale";
  return "current";
}

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
      rpn: item.rpn,
      band: item.risk,
      status: toAssessmentStatus(item.status),
      assessedVersion: stale ? "v1.0" : item.version,
      currentVersion: item.version,
      ruleId: risk?.ruleId ?? "RISK-000",
    };
  });
}

export const isAssessmentsDemoData = true;
