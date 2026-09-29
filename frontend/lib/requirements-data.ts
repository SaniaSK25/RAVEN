/**
 * Requirements list demo-data service.
 *
 * No requirements endpoint exists in the backend yet (backend/app/main.py and
 * backend/app/api/__init__.py are empty), so this module provides temporary
 * typed demo values with an API-shaped structure.
 *
 * To integrate the real API later, replace the body of
 * `getRequirementsDemoData()` with a fetch call to e.g.
 * GET /api/requirements returning `RequirementListItem[]`.
 *
 * Status and assurance reuse the stable domain unions from lib/domain.ts —
 * no duplicate status type is defined here.
 *
 * NOTE on "changed": the domain `RequirementStatus` union has no literal
 * `changed` member. The "changed since assessment" attention case is
 * represented with `warning` (human label notes the change context). If a
 * literal `changed` state is required later, extend `domain.ts` — do not
 * fork a second status type here.
 */

import type {
  AssuranceOutcome,
  RequirementStatus,
  RiskBand,
} from "@/lib/domain";

export type { AssuranceOutcome, RequirementStatus, RiskBand };

/** Lightweight list-view shape for the /requirements workspace. */
export interface RequirementListItem {
  id: string;
  /** Requirement text/title — the main visual focus in the table. */
  title: string;
  /** Display string such as "v1.0". Sort numerically via parseVersion(). */
  version: string;
  risk: RiskBand;
  /** RPN = severity × probability × detectability (1–125). */
  rpn: number;
  assurance: AssuranceOutcome;
  status: RequirementStatus;
}

export type SortKey = "id" | "rpn" | "version";
export type SortDir = "asc" | "desc";

const demoRequirements: RequirementListItem[] = [
  {
    id: "REQ-001",
    title: "Only authenticated users with an authorised role may access GxP records.",
    version: "v2.0",
    risk: "HIGH",
    rpn: 80,
    assurance: "scripted",
    status: "current",
  },
  {
    id: "REQ-002",
    title: "Failed login attempts are locked out and reported after five consecutive failures.",
    version: "v1.1",
    risk: "MEDIUM",
    rpn: 36,
    assurance: "exploratory",
    status: "current",
  },
  {
    id: "REQ-003",
    title: "The system maintains a tamper-evident audit trail for all record creation and modification.",
    version: "v2.1",
    risk: "HIGH",
    rpn: 100,
    assurance: "scripted",
    status: "needs-review",
  },
  {
    id: "REQ-004",
    title: "Audit trail entries record user identity, timestamp, and old and new values.",
    version: "v1.0",
    risk: "HIGH",
    rpn: 75,
    assurance: "scripted",
    status: "current",
  },
  {
    id: "REQ-005",
    title: "Electronic signatures contain printed name, date/time, and signature meaning.",
    version: "v1.2",
    risk: "HIGH",
    rpn: 64,
    assurance: "scripted",
    status: "warning",
  },
  {
    id: "REQ-006",
    title: "System timestamps use synchronised UTC from a qualified NTP source.",
    version: "v1.0",
    risk: "MEDIUM",
    rpn: 40,
    assurance: "exploratory",
    status: "current",
  },
  {
    id: "REQ-007",
    title: "Batch release requires dual electronic approval before stock status changes to released.",
    version: "v1.3",
    risk: "HIGH",
    rpn: 100,
    assurance: "scripted",
    status: "needs-review",
  },
  {
    id: "REQ-008",
    title: "Data entry controls enforce ALCOA+ attributable, legible, and contemporaneous records.",
    version: "v1.0",
    risk: "MEDIUM",
    rpn: 30,
    assurance: "exploratory",
    status: "current",
  },
  {
    id: "REQ-009",
    title: "Validated input ranges reject out-of-specification analytical values with a reason prompt.",
    version: "v1.1",
    risk: "MEDIUM",
    rpn: 27,
    assurance: "exploratory",
    status: "stale",
  },
  {
    id: "REQ-010",
    title: "Installation qualification verifies software version and environment configuration.",
    version: "v1.0",
    risk: "LOW",
    rpn: 12,
    assurance: "unscripted-supplier",
    status: "current",
  },
  {
    id: "REQ-011",
    title: "Operational qualification challenges worst-case workflow paths before go-live.",
    version: "v1.0",
    risk: "MEDIUM",
    rpn: 32,
    assurance: "exploratory",
    status: "warning",
  },
  {
    id: "REQ-012",
    title: "Configuration changes to validated settings require approval and re-verification.",
    version: "v2.0",
    risk: "HIGH",
    rpn: 60,
    assurance: "scripted",
    status: "needs-review",
  },
  {
    id: "REQ-013",
    title: "Nightly backups complete successfully and restore is verified on a defined schedule.",
    version: "v1.2",
    risk: "MEDIUM",
    rpn: 45,
    assurance: "exploratory",
    status: "current",
  },
  {
    id: "REQ-014",
    title: "Disaster recovery restores GxP data within the approved recovery time objective.",
    version: "v1.0",
    risk: "HIGH",
    rpn: 75,
    assurance: "scripted",
    status: "stale",
  },
  {
    id: "REQ-015",
    title: "Inactive sessions terminate automatically after fifteen minutes without activity.",
    version: "v1.1",
    risk: "LOW",
    rpn: 16,
    assurance: "unscripted-adhoc",
    status: "current",
  },
  {
    id: "REQ-016",
    title: "Supplier-provided instrument drivers are covered by vendor qualification evidence.",
    version: "v1.0",
    risk: "LOW",
    rpn: 8,
    assurance: "unscripted-supplier",
    status: "current",
  },
  {
    id: "REQ-017",
    title: "Electronic record retention applies the approved schedule and prevents premature deletion.",
    version: "v1.4",
    risk: "MEDIUM",
    rpn: 48,
    assurance: "exploratory",
    status: "warning",
  },
  {
    id: "REQ-018",
    title: "Periodic review confirms continued validated state and records outstanding deviations.",
    version: "v1.0",
    risk: "LOW",
    rpn: 20,
    assurance: "unscripted-adhoc",
    status: "needs-review",
  },
];

export function getRequirementsDemoData(): RequirementListItem[] {
  return demoRequirements;
}

export const isRequirementsDemoData = true;

/** Parse "v2.1" → [2, 1] for numeric version sorting. */
export function parseVersion(version: string): number[] {
  return version
    .replace(/^[vV]/, "")
    .split(".")
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isNaN(n) ? 0 : n;
    });
}

/** Compare two display-version strings numerically. */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Human-readable uppercase label for a domain status value. */
export function statusLabel(status: RequirementStatus): string {
  switch (status) {
    case "needs-review":
      return "NEEDS REVIEW";
    case "low-confidence":
      return "LOW CONFIDENCE";
    default:
      return status.toUpperCase().replace(/-/g, " ");
  }
}

/** Extra context for the in-union stand-in for "changed since assessment". */
export function statusHint(status: RequirementStatus): string | null {
  if (status === "warning") return "Changed since assessment";
  if (status === "stale") return "Stale — re-assessment due";
  if (status === "needs-review") return "Awaiting QA review";
  return null;
}

/** Human-readable label for a domain assurance outcome. */
export function assuranceLabel(outcome: AssuranceOutcome): string {
  switch (outcome) {
    case "scripted":
      return "SCRIPTED";
    case "exploratory":
      return "EXPLORATORY";
    case "unscripted-supplier":
      return "SUPPLIER ASSURANCE";
    case "unscripted-adhoc":
      return "UNSCRIPTED";
  }
}
