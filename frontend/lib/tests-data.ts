/**
 * Tests demo-data service.
 *
 * No test endpoint exists in the backend yet, so this module derives typed
 * test records from the existing demo sources:
 * - generated tests (purpose/preconditions/steps/status) from the per-ID
 *   DemoTest fixtures in lib/requirement-detail-data.ts — only SCRIPTED
 *   requirements have formal generated tests; non-scripted requirements get
 *   no fake tests, only an explanatory note (see getNonScriptedTests()).
 * - two hand-authored MANUAL tests for scripted requirements where a
 *   human-executed check is the realistic format (marked MANUAL below).
 *
 * Reuses the stable domain unions from lib/domain.ts. The display status
 * (`READY` / `NEEDS REVIEW` / `STALE` / `APPROVED`) is a test-workspace
 * presentation of the domain Test status plus requirement freshness — it is
 * not a duplicate of any domain union (domain has no stale test state):
 * - requirement stale/warning → STALE (test belongs to an older version)
 * - domain "in-review" → NEEDS REVIEW, "approved" → APPROVED, "draft" → READY
 *
 * The `verifiesExcerpt` is the exact requirement text under test, and
 * `warning` flags reviewer attention. No prompts, tokens, or model
 * internals are exposed anywhere in this module.
 *
 * To integrate the real API later, replace `getTestsDemoData()` with a
 * fetch to e.g. GET /api/tests returning `TestRecord[]`.
 */

import type { AssuranceOutcome, TestStep } from "@/lib/domain";
import {
  getRequirementDetail,
  type DemoTest,
} from "@/lib/requirement-detail-data";
import { getRequirementsDemoData } from "@/lib/requirements-data";

export type { AssuranceOutcome };

export type TestType = "GENERATED" | "MANUAL";

export type TestDisplayStatus = "READY" | "NEEDS REVIEW" | "STALE" | "APPROVED";

export interface TestRecord {
  testId: string;
  requirementId: string;
  /** Requirement title/text — also the exact excerpt under test. */
  requirementTitle: string;
  type: TestType;
  status: TestDisplayStatus;
  assurance: AssuranceOutcome;
  purpose: string;
  preconditions: string;
  steps: TestStep[];
  acceptanceCriteria: string;
  /** Exact requirement text excerpt being tested. */
  verifiesExcerpt: string;
  /** Reviewer warning, when present (e.g. numeric value requires review). */
  warning: string | null;
  /** Version the test was written against. */
  testedVersion: string;
  /** Current requirement version (differs when stale). */
  currentVersion: string;
}

/** A non-scripted requirement: correctly has no formal test. */
export interface NonScriptedInfo {
  requirementId: string;
  title: string;
  assurance: AssuranceOutcome;
  /** Assurance rationale explaining why no formal script exists. */
  reason: string;
}

export type TestSortKey = "testId" | "requirementId" | "steps" | "status";
export type TestSortDir = "asc" | "desc";

/** Attention-first order for status sorting (documented, not alphabetical). */
const STATUS_RANK: Record<TestDisplayStatus, number> = {
  STALE: 0,
  "NEEDS REVIEW": 1,
  READY: 2,
  APPROVED: 3,
};

export function compareTestStatus(a: TestDisplayStatus, b: TestDisplayStatus): number {
  return STATUS_RANK[a] - STATUS_RANK[b];
}

function toDisplayStatus(test: DemoTest, reqStatus: string): TestDisplayStatus {
  if (reqStatus === "stale" || reqStatus === "warning") return "STALE";
  if (test.status === "in-review") return "NEEDS REVIEW";
  if (test.status === "approved") return "APPROVED";
  return "READY";
}

function toRecord(
  test: DemoTest,
  req: { id: string; title: string; status: string; version: string },
  assurance: AssuranceOutcome,
  type: TestType,
  warning: string | null,
): TestRecord {
  return {
    testId: test.id,
    requirementId: req.id,
    requirementTitle: req.title,
    type,
    status: toDisplayStatus(test, req.status),
    assurance,
    purpose: test.purpose,
    preconditions: test.preconditions,
    steps: test.steps,
    acceptanceCriteria: `All ${test.steps.length} steps produce the expected results and the evidence is recorded.`,
    verifiesExcerpt: req.title,
    warning,
    testedVersion: req.status === "stale" || req.status === "warning" ? "v1.0" : req.version,
    currentVersion: req.version,
  };
}

/** Hand-authored MANUAL tests (human-executed format is the realistic fit). */
function manualSeeds(): Array<{
  test: DemoTest;
  reqId: string;
  warning: string | null;
}> {
  return [
    {
      test: {
        id: "TST-001-M1",
        requirementId: "REQ-001",
        version: 2.0,
        preconditions: "Authorised reviewer; current role matrix export.",
        steps: [
          {
            stepNumber: 1,
            action: "Sample five GxP user accounts and compare their effective permissions against the role matrix",
            expectedResult: "Every sampled account matches its authorised role with no excess privilege",
          },
          {
            stepNumber: 2,
            action: "Record the review outcome and retain the matrix export as evidence",
            expectedResult: "Signed review record stored alongside the export",
          },
        ],
        status: "draft",
        createdAt: "2026-08-14T09:00:00Z",
        purpose: "Manually verify authorised-role access on a sample of GxP accounts.",
      },
      reqId: "REQ-001",
      warning: null,
    },
    {
      test: {
        id: "TST-014-M1",
        requirementId: "REQ-014",
        version: 1.0,
        preconditions: "Standby site booked; drill observers assigned.",
        steps: [
          {
            stepNumber: 1,
            action: "Execute the recovery runbook step by step and log elapsed time per tier",
            expectedResult: "Each tier restores and the total stays within the recovery time objective",
          },
          {
            stepNumber: 2,
            action: "Complete restore validation and obtain approval to return to GxP service",
            expectedResult: "Validation record approved with no open deviations",
          },
        ],
        status: "draft",
        createdAt: "2026-08-14T09:00:00Z",
        purpose: "Manually execute the disaster-recovery runbook and time each tier.",
      },
      reqId: "REQ-014",
      warning: "Warning: recovery time objective value requires review",
    },
  ];
}

const manualCache = new Map<string, Array<{ test: DemoTest; warning: string | null }>>();

function manualByReqId(reqId: string): Array<{ test: DemoTest; warning: string | null }> {
  if (manualCache.size === 0) {
    for (const seed of manualSeeds()) {
      const list: Array<{ test: DemoTest; warning: string | null }> =
        manualCache.get(seed.reqId) ?? [];
      list.push({ test: seed.test, warning: seed.warning });
      manualCache.set(seed.reqId, list);
    }
  }
  return manualCache.get(reqId) ?? [];
}

export function getTestsDemoData(): TestRecord[] {
  const records: TestRecord[] = [];
  for (const item of getRequirementsDemoData()) {
    if (item.assurance !== "scripted") continue;
    const detail = getRequirementDetail(item.id);
    if (!detail) continue;
    const req = { id: item.id, title: item.title, status: item.status, version: item.version };
    for (const test of detail.tests) {
      records.push(toRecord(test, req, item.assurance, "GENERATED", null));
    }
    for (const { test, warning } of manualByReqId(item.id)) {
      records.push(toRecord(test, req, item.assurance, "MANUAL", warning));
    }
  }
  return records;
}

/** Non-scripted requirements with the assurance reason — not missing work. */
export function getNonScriptedTests(): NonScriptedInfo[] {
  const infos: NonScriptedInfo[] = [];
  for (const item of getRequirementsDemoData()) {
    if (item.assurance === "scripted") continue;
    const rationale = getRequirementDetail(item.id)?.assuranceDetail.rationale ?? "";
    infos.push({
      requirementId: item.id,
      title: item.title,
      assurance: item.assurance,
      reason: rationale,
    });
  }
  return infos;
}

export const isTestsDemoData = true;
