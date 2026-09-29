/**
 * Assessments demo-data service.
 *
 * No assessment endpoint exists in the backend yet, so this module derives
 * typed assessment records from the existing demo sources:
 * - requirement id/title/version/status from lib/requirements-data.ts
 * - severity/probability/detectability/RPN/band/ruleId from the per-ID
 *   riskDetail in lib/requirement-detail-data.ts
 *
 * This introduces no new numbers, so list ↔ assessments ↔ detail stay
 * consistent by construction.
 *
 * Reuses the stable domain unions from lib/domain.ts — no duplicate
 * status/risk unions are defined here. Assessment status uses only
 * `current` (CURRENT), `needs-review` (NEEDS REVIEW), and `stale` (STALE):
 * a `warning` (changed-since-assessment) requirement maps to `stale`
 * because its assessment relates to an outdated requirement version.
 *
 * IMPORTANT: the values below are DISPLAYED as supplied decisions from
 * RAVEN's deterministic engine. S × P × D is shown as a consistency check
 * only — the UI must never recompute bands or RPNs as a source of truth.
 *
 * To integrate the real API later, replace `getAssessmentsDemoData()` with
 * a fetch to e.g. GET /api/assessments returning `AssessmentRecord[]`.
 */

import type { RequirementStatus, RiskBand } from "@/lib/domain";
import { getRequirementDetail } from "@/lib/requirement-detail-data";
import { getRequirementsDemoData } from "@/lib/requirements-data";

export type { RequirementStatus, RiskBand };

export interface AssessmentRecord {
  requirementId: string;
  /** Requirement text/title — the main visual focus in the table. */
  title: string;
  /** 1–5 factor scores, displayed as supplied. */
  severity: number;
  probability: number;
  detectability: number;
  /** RPN = severity × probability × detectability (1–125), as supplied. */
  rpn: number;
  band: RiskBand;
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
