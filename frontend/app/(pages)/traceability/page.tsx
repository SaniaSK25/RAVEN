"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AlertCircle, FileSearch, LoaderCircle, Network, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GraphErrorBoundary from "@/components/traceability/GraphErrorBoundary";
import TraceFilters, { type TraceFilterState } from "@/components/traceability/TraceFilters";
import TraceGraph from "@/components/traceability/TraceGraph";
import TraceMatrix from "@/components/traceability/TraceMatrix";
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
  requirementAliases: Record<string, string>;
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
  const requirementAliases = Object.fromEntries(
    requirementPage.items.flatMap((requirement) => {
      const key = requirement.req_key ?? requirement.id;
      return [[requirement.id, key], [key, key]];
    }),
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
      title: requirement?.description ?? requirementId,
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
    requirementAliases,
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
      reason: orphan.detail,
    })),
  };
}

export default function TraceabilityPage() {
  const [all, setAll] = useState<TraceMatrixRow[]>([]);
  const [orphans, setOrphans] = useState<OrphanArtifact[]>([]);
  const [requirementAliases, setRequirementAliases] = useState<Record<string, string>>({});
  const [graph, setGraph] = useState<{ key: string; data: Traceability } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TraceFilterState>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [graphRefresh, setGraphRefresh] = useState(0);
  const [routeSelectionDismissed, setRouteSelectionDismissed] = useState(false);
  const routeRequirement = useSyncExternalStore(
    (notify) => {
      window.addEventListener("popstate", notify);
      return () => window.removeEventListener("popstate", notify);
    },
    () => new URLSearchParams(window.location.search).get("requirement"),
    () => null,
  );
  const routedRequirementId = routeRequirement
    ? requirementAliases[routeRequirement] ?? routeRequirement
    : null;
  const activeQuery = query || (routeSelectionDismissed ? "" : routedRequirementId ?? "");

  const loadTraceability = useCallback(async () => {
    if (all.length === 0) setLoading(true);
    setError("");
    try {
      const result = await fetchTraceabilityData();
      setAll(result.items);
      setOrphans(result.orphans);
      setRequirementAliases(result.requirementAliases);
      setGraphRefresh((refresh) => refresh + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load traceability.");
    } finally {
      setLoading(false);
    }
  }, [all.length]);

  useEffect(() => {
    let active = true;
    fetchTraceabilityData()
      .then((result) => {
        if (active) {
          setAll(result.items);
          setOrphans(result.orphans);
          setRequirementAliases(result.requirementAliases);
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

  const matches = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    const filtered = all.filter((row) => {
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
    if (!q) return filtered;
    return filtered.sort((left, right) => {
      const score = (row: TraceMatrixRow) => {
        const key = row.requirementId.toLowerCase();
        const text = row.title.toLowerCase();
        if (key === q) return 0;
        if (key.startsWith(q)) return 1;
        if (key.includes(q)) return 2;
        if (text.startsWith(q)) return 3;
        return 4;
      };
      return score(left) - score(right);
    });
  }, [all, activeQuery, filters]);

  const suggestions = matches.slice(0, 5);
  const effectiveSelectedId = selectedId ?? (routeSelectionDismissed ? null : routedRequirementId);
  const graphRow = matches.find((row) => row.requirementId === effectiveSelectedId) ?? null;
  const graphId = graphRow?.requirementId ?? null;
  const currentGraph = graph?.key === graphId ? graph.data : null;
  const graphLoading = Boolean(graphId && currentGraph === null && !error);
  useEffect(() => {
    if (!graphId) return;
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
  }, [graphId, graphRefresh]);

  function handleSelectRequirement(requirementId: string) {
    setRouteSelectionDismissed(true);
    setSelectedId(requirementId);
    setQuery(requirementId);
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
        <section
          aria-label="Find a requirement"
          className="page-panel mt-6"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <RequirementSearch
                value={activeQuery}
                onChange={(value) => {
                  setRouteSelectionDismissed(true);
                  setQuery(value);
                  setSelectedId(null);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void loadTraceability()}
              disabled={loading}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Search by requirement ID or description. Choose a result to view only its matrix and relationship graph.
          </p>
          {activeQuery.trim() ? (
            <div className="mt-4">
              <TraceFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
              />
            </div>
          ) : null}
          {activeQuery.trim() && suggestions.length > 0 ? (
            <ul className="mt-4 space-y-2" aria-label="Matching requirements">
              {suggestions.map((row) => (
                <li key={row.requirementId}>
                  <button
                    type="button"
                    onClick={() => handleSelectRequirement(row.requirementId)}
                    aria-pressed={selectedId === row.requirementId}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                      selectedId === row.requirementId
                        ? "border-accent bg-orange-50 dark:bg-orange-950/30"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className="block font-mono text-xs font-semibold text-accent">
                      {row.requirementId}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm text-zinc-800 dark:text-zinc-100">
                      {row.title}
                    </span>
                  </button>
                </li>
              ))}
              {matches.length > suggestions.length ? (
                <li className="px-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Showing the 5 most relevant of {matches.length} matches.
                </li>
              ) : null}
            </ul>
          ) : activeQuery.trim() ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              No requirements match that search.
            </p>
          ) : null}
        </section>

        {graphRow ? (
          <>
        <section
          aria-label="Traceability matrix"
          className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
        >
            <div className="mb-4">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Requirement matrix
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Recorded risk, assurance, test coverage, and freshness for {graphRow.requirementId}.
              </p>
            </div>
            <TraceMatrix
              items={[graphRow]}
              onViewChain={() =>
                document.getElementById("trace-graph")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </section>

        <section
          id="trace-graph"
          aria-label="Requirement relationship graph"
          className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Relationship graph
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Scroll normally over the graph. Click its empty background to enable panning; click again to turn panning off.
          </p>
          <div className="mt-4">
          {currentGraph && graphRow ? (
            <GraphErrorBoundary requirementId={graphRow.requirementId} trace={currentGraph}>
              <TraceGraph trace={currentGraph} />
              </GraphErrorBoundary>
            ) : graphLoading ? (
              <div role="status" className="flex h-[420px] items-center justify-center gap-2 text-sm text-zinc-500"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Loading requirement chain…</div>
            ) : (
              <EmptyState
                title="Graph unavailable"
                description="Refresh the traceability data and try again."
                actionLabel={null}
                onAction={null}
              />
            )}
            </div>
          </section>
            </>
          ) : (
            <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {activeQuery.trim()
                ? "Choose one of the matching requirements above to load its matrix and graph."
                : "Search for a requirement to view its matrix and graph."}
            </section>
          )}

          <OrphanList orphans={orphans} />
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
