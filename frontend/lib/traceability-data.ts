/**
 * Traceability demo-data service.
 *
 * No traceability endpoint exists in the backend yet, so this module derives
 * typed trace records from the existing demo sources:
 * - requirement id/title/band/rpn/assurance/status from lib/requirements-data.ts
 * - risk/assurance/test links from lib/requirement-detail-data.ts and
 *   lib/tests-data.ts
 *
 * This introduces no new links for the 18 listed requirements, so matrix ↔
 * list ↔ detail stay consistent by construction. Two trace-only requirement
 * stubs (REQ-019, REQ-020) plus two orphan artifacts are hand-authored demo
 * cases so missing coverage and orphans can be demonstrated; they are
 * flagged `inList: false` / `OrphanArtifact` and never link to detail pages.
 *
 * Reuses the domain `TraceNode` / `TraceEdge` / `Traceability` types and the
 * `RiskBand` / `AssuranceOutcome` / `RequirementStatus` unions — no duplicate
 * unions are defined here, except `TraceCoverage`, which is a
 * traceability-specific coverage verdict with no domain equivalent:
 * - Missing: no recorded risk or no recorded assurance
 * - Stale: decision relates to an outdated requirement version
 * - Needs Review: recorded decision awaits QA review
 * - Covered: risk + assurance present, with tests or a valid non-scripted
 *   endpoint (non-scripted assurance is Covered, never missing)
 *
 * To integrate the real API later, replace `getTraceMatrix()` /
 * `getTraceGraph()` / `getOrphanArtifacts()` with fetches to e.g.
 * GET /api/traceability returning these same shapes.
 */

import type {
  AssuranceOutcome,
  RequirementStatus,
  RiskBand,
  TraceEdge,
  TraceNode,
  Traceability,
} from "@/lib/domain";
import { getRequirementDetail } from "@/lib/requirement-detail-data";
import { getRequirementsDemoData } from "@/lib/requirements-data";
import { getTestsDemoData } from "@/lib/tests-data";

export type { AssuranceOutcome, RequirementStatus, RiskBand };

export type TraceCoverage = "Covered" | "Needs Review" | "Stale" | "Missing";

export interface TraceMatrixRow {
  requirementId: string;
  title: string;
  band: RiskBand | null;
  rpn: number | null;
  assurance: AssuranceOutcome | null;
  hasRisk: boolean;
  hasAssurance: boolean;
  /** Formal tests linked (0 for valid non-scripted endpoints). */
  testCount: number;
  coverage: TraceCoverage;
  /** Lifecycle status for attention (stale/needs-review stay visible). */
  status: RequirementStatus;
  /** False for trace-only stubs that have no detail page. */
  inList: boolean;
  currentVersion: string;
}

export interface OrphanArtifact {
  id: string;
  kind: "Test" | "Risk" | "Assurance";
  reason: string;
}

/** Trace-only stubs demonstrating missing coverage (not in /requirements). */
const STUBS: Array<{
  requirementId: string;
  title: string;
  band: RiskBand | null;
  rpn: number | null;
  assurance: AssuranceOutcome | null;
  hasRisk: boolean;
  hasAssurance: boolean;
  status: RequirementStatus;
  currentVersion: string;
}> = [
  {
    requirementId: "REQ-019",
    title: "Periodic audit-trail review records reviewer, date, and outcome.",
    band: "MEDIUM",
    rpn: 36,
    assurance: null,
    hasRisk: true,
    hasAssurance: false,
    status: "processing",
    currentVersion: "v0.1",
  },
  {
    requirementId: "REQ-020",
    title: "Supplier change notifications are reviewed before acceptance.",
    band: null,
    rpn: null,
    assurance: null,
    hasRisk: false,
    hasAssurance: false,
    status: "processing",
    currentVersion: "v0.1",
  },
];

/** Hand-authored orphan demo cases (no linked counterpart exists). */
const ORPHANS: OrphanArtifact[] = [
  {
    id: "TST-099-01",
    kind: "Test",
    reason: "Verifies REQ-099, which was removed from scope — no linked requirement.",
  },
  {
    id: "RISK-REQ-019",
    kind: "Risk",
    reason: "Recorded for REQ-019, which has no assurance decision yet.",
  },
];

function coverageFor(row: {
  hasRisk: boolean;
  hasAssurance: boolean;
  status: RequirementStatus;
}): TraceCoverage {
  if (!row.hasRisk || !row.hasAssurance) return "Missing";
  if (row.status === "stale" || row.status === "warning") return "Stale";
  if (row.status === "needs-review") return "Needs Review";
  return "Covered";
}

export function getTraceMatrix(): TraceMatrixRow[] {
  const testCounts = new Map<string, number>();
  for (const test of getTestsDemoData()) {
    testCounts.set(test.requirementId, (testCounts.get(test.requirementId) ?? 0) + 1);
  }

  const rows: TraceMatrixRow[] = getRequirementsDemoData().map((item) => {
    const coverage = coverageFor({ hasRisk: true, hasAssurance: true, status: item.status });
    return {
      requirementId: item.id,
      title: item.title,
      band: item.risk,
      rpn: item.rpn,
      assurance: item.assurance,
      hasRisk: true,
      hasAssurance: true,
      testCount: testCounts.get(item.id) ?? 0,
      coverage,
      status: item.status,
      inList: true,
      currentVersion: item.version,
    };
  });

  for (const stub of STUBS) {
    rows.push({
      requirementId: stub.requirementId,
      title: stub.title,
      band: stub.band,
      rpn: stub.rpn,
      assurance: stub.assurance,
      hasRisk: stub.hasRisk,
      hasAssurance: stub.hasAssurance,
      testCount: 0,
      coverage: coverageFor(stub),
      status: stub.status,
      inList: false,
      currentVersion: stub.currentVersion,
    });
  }

  return rows;
}

/** Single-requirement chain for the graph view (domain Traceability shape). */
export function getTraceGraph(requirementId: string): Traceability | null {
  const row = getTraceMatrix().find((r) => r.requirementId === requirementId);
  if (!row) return null;

  const nodes: TraceNode[] = [
    { id: row.requirementId, type: "requirement", label: row.requirementId, status: row.status },
  ];
  const edges: TraceEdge[] = [];

  if (row.hasRisk) {
    const riskId = `risk-${row.requirementId}`;
    nodes.push({ id: riskId, type: "risk", label: `${row.band ?? "—"} · RPN ${row.rpn ?? "—"}`, status: row.status });
    edges.push({ id: `e-${row.requirementId}-risk`, from: row.requirementId, to: riskId, type: "has_risk" });
    if (row.hasAssurance && row.assurance) {
      const assuranceId = `assurance-${row.requirementId}`;
      nodes.push({ id: assuranceId, type: "assurance", label: row.assurance, status: row.status });
      edges.push({ id: `e-${riskId}-assurance`, from: riskId, to: assuranceId, type: "assessed_as" });
      if (row.inList) {
        const detail = getRequirementDetail(row.requirementId);
        const tests = detail?.tests ?? [];
        if (tests.length > 0) {
          for (const test of tests) {
            nodes.push({ id: test.id, type: "test", label: test.id, status: row.status });
            edges.push({ id: `e-${assuranceId}-${test.id}`, from: assuranceId, to: test.id, type: "verifies" });
          }
        } else {
          const endpointId = `endpoint-${row.requirementId}`;
          nodes.push({ id: endpointId, type: "assurance", label: "Coverage endpoint — no formal test", status: row.status });
          edges.push({ id: `e-${assuranceId}-endpoint`, from: assuranceId, to: endpointId, type: "mitigated_by" });
        }
      }
    }
  }

  return { nodes, edges };
}

export function getOrphanArtifacts(): OrphanArtifact[] {
  return ORPHANS;
}

export const isTraceabilityDemoData = true;
