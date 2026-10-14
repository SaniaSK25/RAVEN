"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FileSearch, LoaderCircle, Network, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GraphErrorBoundary from "@/components/traceability/GraphErrorBoundary";
import TraceFilters, { type TraceFilterState } from "@/components/traceability/TraceFilters";
import TraceGraph from "@/components/traceability/TraceGraph";
import TraceMatrix from "@/components/traceability/TraceMatrix";
import TraceSummary from "@/components/traceability/TraceSummary";
import OrphanList from "@/components/traceability/OrphanList";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import type { OrphanArtifact, TraceMatrixRow } from "@/lib/traceability-data";
import type { TraceEdge, TraceNode, Traceability } from "@/lib/domain";
import {
  backendFetch,
  type BackendOrphans,
  type BackendPage,
  type BackendRequirement,
  type BackendTraceGraph,
  type BackendTraceMatrix,
} from "@/lib/backend-api";

const EMPTY_FILTERS: TraceFilterState = { coverage: [], risks: [], assurances: [] };

type TraceView = "matrix" | "graph";

function toCoverage(value: unknown): TraceMatrixRow["coverage"] {
  if (value === "covered_by_tests" || value === "covered_by_assurance") return "Covered";
  if (value === "stale") return "Stale";
  if (value === "needs_review") return "Needs Review";
  return "Missing";
}

function toBand(value: unknown): TraceMatrixRow["band"] {
  if (typeof value !== "string") return null;
  const band = value.toUpperCase();
  return band === "LOW" || band === "MEDIUM" || band === "HIGH" ? band : null;
}

function toAssurance(value: unknown): TraceMatrixRow["assurance"] {
  if (value === "scripted" || value === "exploratory") return value;
  if (value === "unscripted") return value;
  return null;
}

const GRAPH_EDGE_TYPES: Record<string, TraceEdge["type"]> = {
  has_risk: "has_risk",
  assessed_as: "assessed_as",
  mitigated_by: "mitigated_by",
  verifies: "verifies",
};

function adaptGraph(data: BackendTraceGraph): Traceability {
  const nodes: TraceNode[] = data.nodes.flatMap((node) => {
    if (
      node.type !== "requirement" &&
      node.type !== "risk" &&
      node.type !== "assurance" &&
      node.type !== "test"
    ) return [];
    const status =
      node.stale
        ? "stale"
        : node.type === "requirement" && node.meta.status === "deleted"
          ? "superseded"
          : "current";
    return [{ id: node.id, type: node.type, label: node.label, status }];
  });
  const edges: TraceEdge[] = data.edges.flatMap((edge) => {
    const type = GRAPH_EDGE_TYPES[edge.type];
    return type
      ? [{
          id: edge.id,
          from: edge.source,
          to: edge.target,
          type,
        }]
      : [];
  });
  return { nodes, edges };
}

async function fetchTraceabilityData(): Promise<{
  items: TraceMatrixRow[];
  orphans: OrphanArtifact[];
}> {
  const [matrix, requirementPage, orphanData] = await Promise.all([
    backendFetch<BackendTraceMatrix>("traceability/matrix"),
    backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500"),
    backendFetch<BackendOrphans>("traceability/orphans"),
  ]);
  const requirements = new Map(
    requirementPage.items.map((requirement) => [
      requirement.req_key ?? requirement.id,
      requirement,
    ]),
  );
  const aggregated = new Map<string, TraceMatrixRow>();
  for (const row of matrix.rows) {
    const requirementId = String(row.requirement_id ?? "");
    if (!requirementId) continue;
    const requirement = requirements.get(requirementId);
    const existing = aggregated.get(requirementId);
    if (existing) {
      if (typeof row.test_id === "string" && row.test_id) existing.testCount += 1;
      continue;
    }
    const version = row.requirement_version;
    const assurance = toAssurance(row.assurance_level);
    aggregated.set(requirementId, {
      requirementId,
      title: requirement?.title ?? requirementId,
      band: toBand(row.band),
      rpn: typeof row.rpn === "number" ? row.rpn : null,
      assurance,
      hasRisk: typeof row.risk_id === "string" && row.risk_id.length > 0,
      hasAssurance: assurance !== null,
      testCount: typeof row.test_id === "string" && row.test_id ? 1 : 0,
      coverage: toCoverage(row.coverage_status),
      status: row.stale === true ? "stale" : "current",
      inList: requirement !== undefined,
      currentVersion: typeof version === "number" ? `v${version}` : "—",
    });
  }
  return {
    items: [...aggregated.values()],
    orphans: orphanData.orphans.map((orphan) => ({
      id: orphan.entity_key || orphan.entity_id,
      kind:
        orphan.entity_type === "test"
          ? "Test"
          : orphan.entity_type === "requirement"
            ? "Requirement"
            : orphan.entity_type === "risk"
              ? "Risk"
              : "Assurance",
      reason: orphan.reason,
    })),
  };
}

export default function TraceabilityPage() {
  const [all, setAll] = useState<TraceMatrixRow[]>([]);
  const [orphans, setOrphans] = useState<OrphanArtifact[]>([]);
  const [graph, setGraph] = useState<{ key: string; data: Traceability } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TraceFilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<TraceView>("matrix");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTraceability = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchTraceabilityData();
      setAll(result.items);
      setOrphans(result.orphans);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load traceability.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchTraceabilityData()
      .then((result) => {
        if (active) {
          setAll(result.items);
          setOrphans(result.orphans);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load traceability.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((row) => {
      if (filters.coverage.length > 0 && !filters.coverage.includes(row.coverage)) {
        return false;
      }
      if (filters.risks.length > 0 && (row.band === null || !filters.risks.includes(row.band))) {
        return false;
      }
      if (
        filters.assurances.length > 0 &&
        (row.assurance === null || !filters.assurances.includes(row.assurance))
      ) {
        return false;
      }
      if (q) {
        const haystack = `${row.requirementId} ${row.title}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, filters]);

  const graphId = selectedId && visible.some((r) => r.requirementId === selectedId)
    ? selectedId
    : (visible[0]?.requirementId ?? null);
  const graphRow = visible.find((r) => r.requirementId === graphId) ?? null;
  useEffect(() => {
    if (view !== "graph" || !graphId) return;
    let active = true;
    backendFetch<BackendTraceGraph>(
      `traceability/graph?requirement_key=${encodeURIComponent(graphId)}`,
    )
      .then((data) => {
        if (active) setGraph({ key: graphId, data: adaptGraph(data) });
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Could not load the trace graph.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [graphId, view]);

  const currentGraph = graph?.key === graphId ? graph.data : null;

  const hasActiveSearchOrFilters =
    query.trim() !== "" ||
    filters.coverage.length > 0 ||
    filters.risks.length > 0 ||
    filters.assurances.length > 0;

  function handleClearAll() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  }

  function handleViewChain(requirementId: string) {
    setSelectedId(requirementId);
    setView("graph");
  }

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Backend records</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Traceability
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Coverage and relationship workspace — what is connected to what.
        </p>
      </div>

      {error ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <span className="flex items-center gap-2"><AlertCircle aria-hidden="true" className="h-4 w-4" />{error}</span>
          <button type="button" onClick={() => void loadTraceability()} className="inline-flex items-center gap-2 font-medium underline"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Retry</button>
        </div>
      ) : null}

      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Loading traceability from RAVEN…</div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="mt-6">
            <TraceSummary rows={all} orphans={orphans} />
          </div>

          <section
            aria-label="Search and filter"
            className="page-panel mt-4"
          >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <RequirementSearch value={query} onChange={setQuery} />
            <div role="group" aria-label="View selection" className="flex rounded-md border border-zinc-300 dark:border-zinc-700">
              {(["matrix", "graph"] as TraceView[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  aria-pressed={view === option}
                  className={`px-4 py-2 text-sm font-medium capitalize first:rounded-l-md last:rounded-r-md focus-visible:outline-2 focus-visible:outline-zinc-900 ${
                    view === option
                      ? "bg-accent text-brand dark:bg-accent dark:text-brand"
                      : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <TraceFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
          />
        </div>
          </section>

          {view === "matrix" ? (
        <section
          aria-label="Traceability matrix"
          className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
        >
          {all.length === 0 ? (
            <EmptyState
              title="No traceability data yet"
              description="Links appear here once requirements are assessed."
              actionLabel={null}
              onAction={null}
            />
          ) : visible.length > 0 ? (
            <TraceMatrix items={visible} onViewChain={handleViewChain} />
              ) : (
            <EmptyState
              title={query.trim() !== "" ? "No links match your search" : "No links match these filters"}
              description="Try a different ID or keyword, or remove some filters to see more of the matrix."
              actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
              onAction={hasActiveSearchOrFilters ? handleClearAll : null}
            />
          )}
        </section>
      ) : (
        <section
          aria-label="Traceability graph"
          className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="trace-graph-select"
              className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
            >
              Requirement chain
            </label>
            <select
              id="trace-graph-select"
              value={graphId ?? ""}
              onChange={(e) => setSelectedId(e.target.value || null)}
              disabled={visible.length === 0}
              className="max-w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-[13px] text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {visible.map((row) => (
                <option key={row.requirementId} value={row.requirementId}>
                  {row.requirementId}
                </option>
              ))}
            </select>
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
              Exploration view — zoom, pan, select, and click a node to navigate. The matrix
              remains the audit view.
            </span>
          </div>
          <div className="mt-4">
            {currentGraph && graphRow ? (
              <GraphErrorBoundary requirementId={graphRow.requirementId} trace={currentGraph}>
                <TraceGraph trace={currentGraph} requirementId={graphRow.requirementId} canOpenDetail={graphRow.inList} />
              </GraphErrorBoundary>
            ) : loading || (graphId && !currentGraph && !error) ? (
              <div role="status" className="flex h-[420px] items-center justify-center gap-2 text-sm text-zinc-500"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Loading requirement chain…</div>
            ) : (
              <EmptyState
                title="No chain to show"
                description="Adjust the search or filters to include at least one requirement."
                actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
                onAction={hasActiveSearchOrFilters ? handleClearAll : null}
              />
            )}
          </div>
        </section>
          )}

          {view === "matrix" && visible.length > 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Showing {visible.length} of {all.length} requirements. Select a row to open its detail
          view, or use the chain action for the exploration graph.
        </p>
          ) : null}

          <OrphanList orphans={orphans} />

          <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
            Live traceability records. This page displays backend links and does not create or modify edges.
          </p>
        </>
      ) : null}
    </DashboardLayout>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string | null;
  onAction: (() => void) | null;
}) {
  const Icon = actionLabel ? FileSearch : Network;
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
      >
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
