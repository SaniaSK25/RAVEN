/**
 * Compliance demo-data service.
 *
 * No compliance endpoint exists in the backend yet, so this module provides
 * hand-authored, typed regulatory criteria referencing the existing demo
 * requirements (IDs and exact requirement text match lib/requirements-data.ts).
 *
 * Reuses the domain `CoverageStatus` union (covered | partial | absent) —
 * no duplicate status unions are defined here.
 *
 * IMPORTANT: this is an illustrative demo subset of FDA 21 CFR Part 11 and
 * EU GMP Annex 11. It is NOT a complete or authoritative regulatory
 * registry, and no real compliance analysis runs in this task. Statuses are
 * recorded demo values; the page displays obligations, evidence, and named
 * gaps — never a compliance percentage or vague verdict.
 *
 * To integrate the real API later, replace `getComplianceDemoData()` with a
 * fetch to e.g. GET /api/compliance returning `ComplianceRecord[]`.
 */

import type { CoverageStatus } from "@/lib/domain";

export type { CoverageStatus };

export type Regulation = "FDA 21 CFR Part 11" | "EU GMP Annex 11";

export interface SupportingRequirement {
  requirementId: string;
  /** Exact requirement text. */
  title: string;
  /** Supporting excerpt (requirement text underpinning this criterion). */
  excerpt: string;
}

export interface ComplianceRecord {
  id: string;
  regulation: Regulation;
  /** Atomic clause reference, e.g. "§11.10(e)". */
  code: string;
  /** The regulatory obligation in plain language. */
  title: string;
  status: CoverageStatus;
  supporting: SupportingRequirement[];
  /** Specific missing obligations (human-readable, never vague). */
  gaps: string[];
  /** True when a human must look: low confidence, partial, or absent. */
  needsReview: boolean;
  reviewReason: string | null;
}

export function getComplianceDemoData(): ComplianceRecord[] {
  return demoCriteria;
}

export const isComplianceDemoData = true;

export type ComplianceSortKey = "criterion" | "status";
export type ComplianceSortDir = "asc" | "desc";

/** Attention-first order for status sorting (documented, not alphabetical). */
const STATUS_RANK: Record<CoverageStatus, number> = {
  absent: 0,
  partial: 1,
  covered: 2,
};

export function compareCoverageStatus(a: CoverageStatus, b: CoverageStatus): number {
  return STATUS_RANK[a] - STATUS_RANK[b];
}

const demoCriteria: ComplianceRecord[] = [
  {
    id: "CR-11-10a",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.10(a)",
    title: "Systems are validated to ensure accuracy, reliability, and intended performance.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-010",
        title: "Installation qualification verifies software version and environment configuration.",
        excerpt: "Installation qualification verifies software version and environment configuration.",
      },
      {
        requirementId: "REQ-011",
        title: "Operational qualification challenges worst-case workflow paths before go-live.",
        excerpt: "Operational qualification challenges worst-case workflow paths before go-live.",
      },
    ],
    gaps: [],
    needsReview: false,
    reviewReason: null,
  },
  {
    id: "CR-11-10d",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.10(d)",
    title: "System access is limited to authorized individuals.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-001",
        title: "Only authenticated users with an authorised role may access GxP records.",
        excerpt: "Only authenticated users with an authorised role may access GxP records.",
      },
      {
        requirementId: "REQ-015",
        title: "Inactive sessions terminate automatically after fifteen minutes without activity.",
        excerpt: "Inactive sessions terminate automatically after fifteen minutes without activity.",
      },
    ],
    gaps: [],
    needsReview: false,
    reviewReason: null,
  },
  {
    id: "CR-11-10e",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.10(e)",
    title: "A secure, computer-generated, time-stamped audit trail records operator actions.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-003",
        title: "The system maintains a tamper-evident audit trail for all record creation and modification.",
        excerpt: "The system maintains a tamper-evident audit trail for all record creation and modification.",
      },
      {
        requirementId: "REQ-004",
        title: "Audit trail entries record user identity, timestamp, and old and new values.",
        excerpt: "Audit trail entries record user identity, timestamp, and old and new values.",
      },
    ],
    gaps: [],
    needsReview: true,
    reviewReason: "Low-confidence evidence: tamper-alert review wording needs QA confirmation.",
  },
  {
    id: "CR-11-10b",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.10(b)",
    title: "Records can be retrieved and rendered in accurate, human-readable form.",
    status: "partial",
    supporting: [
      {
        requirementId: "REQ-017",
        title: "Electronic record retention applies the approved schedule and prevents premature deletion.",
        excerpt: "Electronic record retention applies the approved schedule and prevents premature deletion.",
      },
    ],
    gaps: ["No requirement explicitly addresses rendering retained records in human-readable form on retrieval."],
    needsReview: true,
    reviewReason: "Partial coverage: retrieval rendering obligation is unaddressed.",
  },
  {
    id: "CR-11-10f",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.10(f)",
    title: "Operational checks enforce permitted sequencing of steps and events.",
    status: "partial",
    supporting: [
      {
        requirementId: "REQ-009",
        title: "Validated input ranges reject out-of-specification analytical values with a reason prompt.",
        excerpt: "Validated input ranges reject out-of-specification analytical values with a reason prompt.",
      },
    ],
    gaps: ["No requirement explicitly addresses enforcement of step sequencing or event ordering."],
    needsReview: true,
    reviewReason: "Partial coverage: sequencing obligation is unaddressed.",
  },
  {
    id: "CR-11-50a",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.50(a)",
    title: "Signed records show printed name, date/time, and signature meaning.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-005",
        title: "Electronic signatures contain printed name, date/time, and signature meaning.",
        excerpt: "Electronic signatures contain printed name, date/time, and signature meaning.",
      },
    ],
    gaps: [],
    needsReview: false,
    reviewReason: null,
  },
  {
    id: "CR-11-70",
    regulation: "FDA 21 CFR Part 11",
    code: "§11.70",
    title: "Electronic signatures are linked to their records to prevent removal or alteration.",
    status: "absent",
    supporting: [],
    gaps: ["No requirement explicitly addresses linking signatures to records against removal or alteration."],
    needsReview: true,
    reviewReason: "Absent criterion: no supporting requirement exists.",
  },
  {
    id: "CR-A11-4",
    regulation: "EU GMP Annex 11",
    code: "§4",
    title: "Computerised systems are validated for their intended use.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-010",
        title: "Installation qualification verifies software version and environment configuration.",
        excerpt: "Installation qualification verifies software version and environment configuration.",
      },
      {
        requirementId: "REQ-011",
        title: "Operational qualification challenges worst-case workflow paths before go-live.",
        excerpt: "Operational qualification challenges worst-case workflow paths before go-live.",
      },
    ],
    gaps: [],
    needsReview: false,
    reviewReason: null,
  },
  {
    id: "CR-A11-9",
    regulation: "EU GMP Annex 11",
    code: "§9",
    title: "Audit trails record the creation, modification, and deletion of GxP data.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-003",
        title: "The system maintains a tamper-evident audit trail for all record creation and modification.",
        excerpt: "The system maintains a tamper-evident audit trail for all record creation and modification.",
      },
    ],
    gaps: [],
    needsReview: false,
    reviewReason: null,
  },
  {
    id: "CR-A11-6",
    regulation: "EU GMP Annex 11",
    code: "§6",
    title: "GxP records carry accurate, synchronised timestamps.",
    status: "partial",
    supporting: [
      {
        requirementId: "REQ-006",
        title: "System timestamps use synchronised UTC from a qualified NTP source.",
        excerpt: "System timestamps use synchronised UTC from a qualified NTP source.",
      },
    ],
    gaps: ["No requirement explicitly addresses clock-drift tolerance or monitoring."],
    needsReview: true,
    reviewReason: "Partial coverage: drift tolerance is unaddressed.",
  },
  {
    id: "CR-A11-5",
    regulation: "EU GMP Annex 11",
    code: "§5",
    title: "Data integrity controls keep records attributable, legible, and contemporaneous.",
    status: "covered",
    supporting: [
      {
        requirementId: "REQ-008",
        title: "Data entry controls enforce ALCOA+ attributable, legible, and contemporaneous records.",
        excerpt: "Data entry controls enforce ALCOA+ attributable, legible, and contemporaneous records.",
      },
    ],
    gaps: [],
    needsReview: false,
    reviewReason: null,
  },
  {
    id: "CR-A11-12",
    regulation: "EU GMP Annex 11",
    code: "§12.4",
    title: "Audit trails are subject to periodic review.",
    status: "absent",
    supporting: [],
    gaps: ["No requirement currently covers the periodic audit-trail review cadence."],
    needsReview: true,
    reviewReason: "Absent criterion: no supporting requirement exists.",
  },
];
