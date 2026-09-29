/**
 * Changes demo-data service.
 *
 * No change-event endpoint exists in the backend yet, so this module provides
 * hand-authored, typed change events referencing the existing demo
 * requirements and artifact IDs (risk/assurance/test IDs match the detail
 * and tests demo data).
 *
 * Reuses `RequirementStatus` from lib/domain.ts for requirement freshness.
 * The work-queue `ChangeStatus` union (NEEDS REVIEW / RE-ANALYSIS REQUIRED /
 * CONFIRMED VALID / ACCEPTED) has no domain equivalent — the domain
 * `ChangeEvent.status` is a coarser workflow state — so it is defined here
 * as a change-specific display union, not a duplicate.
 *
 * Review actions on this page are demo/local interactions only: confirming
 * or queueing re-analysis changes in-memory UI state and never touches a
 * backend. Stale states are never silently cleared.
 *
 * To integrate the real API later, replace `getChangesDemoData()` with a
 * fetch to e.g. GET /api/changes returning `ChangeRecord[]`.
 */

import type { RequirementStatus } from "@/lib/domain";

export type { RequirementStatus };

export type ChangeStatus =
  | "NEEDS REVIEW"
  | "RE-ANALYSIS REQUIRED"
  | "CONFIRMED VALID"
  | "ACCEPTED";

export type ImpactKind = "Evidence" | "Risk" | "Assurance" | "Test";

export interface ImpactedArtifact {
  kind: ImpactKind;
  /** Short display ID, e.g. "Risk", "TST-003-01". */
  id: string;
  /** Artifact state — stale artifacts stay stale until reviewed. */
  state: "STALE" | "CURRENT";
  /** Version the artifact was created against. */
  createdAgainst: string;
  /** Where the artifact can be inspected (existing routes only). */
  href: string;
}

export interface ChangeRecord {
  id: string;
  requirementId: string;
  /** Current requirement title/text. */
  title: string;
  fromVersion: string;
  toVersion: string;
  /** Current (latest) requirement version. */
  currentVersion: string;
  /** Full version chain for history display, oldest first. */
  versionHistory: string[];
  /** Short queue summary, e.g. "Requirement text changed". */
  changeSummary: string;
  oldText: string;
  newText: string;
  /** Substring of newText highlighted as the change. */
  changedFragment: string;
  impacted: ImpactedArtifact[];
  status: ChangeStatus;
  /** Demo event date (ISO). */
  date: string;
  reqStatus: RequirementStatus;
}

export type ChangeSortKey = "date" | "requirementId" | "status";
export type ChangeSortDir = "asc" | "desc";

function riskHref(reqId: string): string {
  return `/requirements/${reqId}?tab=risk`;
}

function testHref(reqId: string): string {
  return `/requirements/${reqId}?tab=tests`;
}

function assuranceHref(reqId: string): string {
  return `/requirements/${reqId}?tab=assurance`;
}

function evidenceHref(reqId: string): string {
  return `/requirements/${reqId}?tab=evidence`;
}

const demoChanges: ChangeRecord[] = [
  {
    id: "CHG-001",
    requirementId: "REQ-001",
    title: "Only authenticated users with an authorised role may access GxP records.",
    fromVersion: "v1.0",
    toVersion: "v2.0",
    currentVersion: "v2.0",
    versionHistory: ["v1.0", "v2.0"],
    changeSummary: "Authorised-role wording clarified",
    oldText: "Only authenticated users may access GxP records.",
    newText: "Only authenticated users with an authorised role may access GxP records.",
    changedFragment: "with an authorised role",
    impacted: [
      { kind: "Evidence", id: "Evidence", state: "CURRENT", createdAgainst: "v2.0", href: evidenceHref("REQ-001") },
      { kind: "Risk", id: "Risk", state: "CURRENT", createdAgainst: "v2.0", href: riskHref("REQ-001") },
      { kind: "Assurance", id: "Assurance", state: "CURRENT", createdAgainst: "v2.0", href: assuranceHref("REQ-001") },
      { kind: "Test", id: "TST-001-01", state: "CURRENT", createdAgainst: "v2.0", href: testHref("REQ-001") },
      { kind: "Test", id: "TST-001-M1", state: "CURRENT", createdAgainst: "v2.0", href: testHref("REQ-001") },
    ],
    status: "CONFIRMED VALID",
    date: "2026-03-02",
    reqStatus: "current",
  },
  {
    id: "CHG-002",
    requirementId: "REQ-002",
    title: "Failed login attempts are locked out and reported after five consecutive failures.",
    fromVersion: "v1.0",
    toVersion: "v1.1",
    currentVersion: "v1.1",
    versionHistory: ["v1.0", "v1.1"],
    changeSummary: "Lockout threshold clarified",
    oldText: "Failed login attempts are locked out and reported.",
    newText: "Failed login attempts are locked out and reported after five consecutive failures.",
    changedFragment: "after five consecutive failures",
    impacted: [
      { kind: "Evidence", id: "Evidence", state: "CURRENT", createdAgainst: "v1.1", href: evidenceHref("REQ-002") },
      { kind: "Risk", id: "Risk", state: "CURRENT", createdAgainst: "v1.1", href: riskHref("REQ-002") },
    ],
    status: "ACCEPTED",
    date: "2026-04-11",
    reqStatus: "current",
  },
  {
    id: "CHG-003",
    requirementId: "REQ-003",
    title: "The system maintains a tamper-evident audit trail for all record creation and modification.",
    fromVersion: "v2.0",
    toVersion: "v2.1",
    currentVersion: "v2.1",
    versionHistory: ["v1.0", "v2.0", "v2.1"],
    changeSummary: "Tamper-evidence requirement strengthened",
    oldText: "The system maintains an audit trail for all record creation and modification.",
    newText: "The system maintains a tamper-evident audit trail for all record creation and modification.",
    changedFragment: "tamper-evident",
    impacted: [
      { kind: "Evidence", id: "Evidence", state: "STALE", createdAgainst: "v2.0", href: evidenceHref("REQ-003") },
      { kind: "Risk", id: "Risk", state: "STALE", createdAgainst: "v2.0", href: riskHref("REQ-003") },
      { kind: "Assurance", id: "Assurance", state: "STALE", createdAgainst: "v2.0", href: assuranceHref("REQ-003") },
      { kind: "Test", id: "TST-003-01", state: "STALE", createdAgainst: "v2.0", href: testHref("REQ-003") },
      { kind: "Test", id: "TST-003-02", state: "STALE", createdAgainst: "v2.0", href: testHref("REQ-003") },
    ],
    status: "NEEDS REVIEW",
    date: "2026-08-10",
    reqStatus: "needs-review",
  },
  {
    id: "CHG-004",
    requirementId: "REQ-005",
    title: "Electronic signatures contain printed name, date/time, and signature meaning.",
    fromVersion: "v1.0",
    toVersion: "v1.2",
    currentVersion: "v1.2",
    versionHistory: ["v1.0", "v1.2"],
    changeSummary: "Signature meaning added",
    oldText: "Electronic signatures contain printed name and date/time.",
    newText: "Electronic signatures contain printed name, date/time, and signature meaning.",
    changedFragment: "and signature meaning",
    impacted: [
      { kind: "Evidence", id: "Evidence", state: "STALE", createdAgainst: "v1.0", href: evidenceHref("REQ-005") },
      { kind: "Risk", id: "Risk", state: "STALE", createdAgainst: "v1.0", href: riskHref("REQ-005") },
      { kind: "Assurance", id: "Assurance", state: "STALE", createdAgainst: "v1.0", href: assuranceHref("REQ-005") },
      { kind: "Test", id: "TST-005-01", state: "STALE", createdAgainst: "v1.0", href: testHref("REQ-005") },
    ],
    status: "NEEDS REVIEW",
    date: "2026-07-22",
    reqStatus: "warning",
  },
  {
    id: "CHG-005",
    requirementId: "REQ-007",
    title: "Batch release requires dual electronic approval before stock status changes to released.",
    fromVersion: "v1.2",
    toVersion: "v1.3",
    currentVersion: "v1.3",
    versionHistory: ["v1.0", "v1.2", "v1.3"],
    changeSummary: "Dual-approval independence rule added",
    oldText: "Batch release requires electronic approval before stock status changes to released.",
    newText: "Batch release requires dual electronic approval before stock status changes to released.",
    changedFragment: "dual",
    impacted: [
      { kind: "Risk", id: "Risk", state: "STALE", createdAgainst: "v1.2", href: riskHref("REQ-007") },
      { kind: "Assurance", id: "Assurance", state: "STALE", createdAgainst: "v1.2", href: assuranceHref("REQ-007") },
      { kind: "Test", id: "TST-007-01", state: "STALE", createdAgainst: "v1.2", href: testHref("REQ-007") },
    ],
    status: "RE-ANALYSIS REQUIRED",
    date: "2026-08-12",
    reqStatus: "needs-review",
  },
  {
    id: "CHG-006",
    requirementId: "REQ-012",
    title: "Configuration changes to validated settings require approval and re-verification.",
    fromVersion: "v1.0",
    toVersion: "v2.0",
    currentVersion: "v2.0",
    versionHistory: ["v1.0", "v2.0"],
    changeSummary: "Re-verification scope added",
    oldText: "Configuration changes to validated settings require approval.",
    newText: "Configuration changes to validated settings require approval and re-verification.",
    changedFragment: "and re-verification",
    impacted: [
      { kind: "Evidence", id: "Evidence", state: "STALE", createdAgainst: "v1.0", href: evidenceHref("REQ-012") },
      { kind: "Risk", id: "Risk", state: "STALE", createdAgainst: "v1.0", href: riskHref("REQ-012") },
      { kind: "Test", id: "TST-012-01", state: "STALE", createdAgainst: "v1.0", href: testHref("REQ-012") },
    ],
    status: "NEEDS REVIEW",
    date: "2026-06-30",
    reqStatus: "needs-review",
  },
];

export function getChangesDemoData(): ChangeRecord[] {
  return demoChanges;
}

/** Demo-only requirement IDs referenced by change events (for the filter). */
export function getChangedRequirementIds(): string[] {
  return demoChanges.map((c) => c.requirementId);
}

export const isChangesDemoData = true;
