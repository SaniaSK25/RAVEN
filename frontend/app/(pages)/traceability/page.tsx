"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, LoaderCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GraphErrorBoundary from "@/components/traceability/GraphErrorBoundary";
import TraceFilters, { type TraceFilterState } from "@/components/traceability/TraceFilters";
import TraceGraph from "@/components/traceability/TraceGraph";
import TraceMatrix from "@/components/traceability/TraceMatrix";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import type { TraceMatrixRow } from "@/lib/traceability-data";
import type { TraceEdge, TraceNode, Traceability } from "@/lib/domain";
import {
  backendFetch,
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
    return [{ id: node.id, type: node.type, label: node.label, status, orphaned: node.orphaned ?? false }];
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
  requirementAliases: Record<string, string>;
  requirements: Record<string, BackendRequirement>;
}> {
  const [matrix, requirementPage] = await Promise.all([
    backendFetch<BackendTraceMatrix>("traceability/matrix"),
    backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500"),
  ]);
  const requirements = new Map(
    requirementPage.items.map((requirement) => [
      requirement.req_key ?? requirement.id,
      requirement,
    ]),
  );
  const requirementsByKey = Object.fromEntries(
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
    requirements: requirementsByKey,
  };
}

export default function TraceabilityPage() {
  // Deep-link parameter (?requirement=KEY) read from the address bar on mount.
  // Kept off the prerendered payload so the static page needs no Suspense boundary.
  const [deepLink, setDeepLink] = useState("");
  const [all, setAll] = useState<TraceMatrixRow[]>([]);
  const [requirementAliases, setRequirementAliases] = useState<Record<string, string>>({});
  const [requirements, setRequirements] = useState<Record<string, BackendRequirement>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TraceFilterState>(EMPTY_FILTERS);
  // Per-requirement graph state: visibility, selected version, fetched data.
  const [graphVisible, setGraphVisible] = useState<Record<string, boolean>>({});
  const [graphVersions, setGraphVersions] = useState<Record<string, number>>({});
  const [requirementGraphs, setRequirementGraphs] = useState<
    Record<string, { data: Traceability; loading: boolean }>
  >({});

  // Initialize filters from URL param (e.g., /traceability?requirement=REQ-0001).
  useEffect(() => {
    const requirementParam =
      new URLSearchParams(window.location.search).get("requirement") ?? "";
    if (requirementParam) {
      setQuery(requirementParam);
    }
    setDeepLink(requirementParam);
  }, []);

  const loadTraceability = useCallback(async () => {
    if (all.length === 0) setLoading(true);
    setError("");
    try {
      const result = await fetchTraceabilityData();
      setAll(result.items);
      setRequirementAliases(result.requirementAliases);
      setRequirements(result.requirements);
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
          setRequirementAliases(result.requirementAliases);
          setRequirements(result.requirements);
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
    const q = query.trim().toLowerCase();
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
  }, [all, query, filters]);

  // Fetch the graph for a specific requirement + version on demand.
  const fetchGraph = useCallback(
    async (requirementId: string, version: number) => {
      setRequirementGraphs((prev) => ({
        ...prev,
        [requirementId]: { data: prev[requirementId]?.data ?? { nodes: [], edges: [] }, loading: true },
      }));
      try {
        const data = await backendFetch<BackendTraceGraph>(
          `traceability/graph?requirement_key=${encodeURIComponent(requirementId)}&version=${version}`,
        );
        setRequirementGraphs((prev) => ({
          ...prev,
          [requirementId]: { data: adaptGraph(data), loading: false },
        }));
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : "Could not load the trace graph.");
        setRequirementGraphs((prev) => ({
          ...prev,
          [requirementId]: { data: prev[requirementId]?.data ?? { nodes: [], edges: [] }, loading: false },
        }));
      }
    },
    [],
  );

  // Toggle graph visibility for a requirement.
  const toggleGraph = useCallback(
    (requirementId: string, version: number) => {
      setGraphVisible((prev) => {
        const next = !prev[requirementId];
        // Fetch the graph when showing it for the first time or when version changes.
        if (next) {
          const existing = requirementGraphs[requirementId];
          if (!existing || existing.data.nodes.length === 0) {
            void fetchGraph(requirementId, version);
          }
        }
        return { ...prev, [requirementId]: next };
      });
    },
    [fetchGraph, requirementGraphs],
  );

  // Handle version change — refetch if graph is already visible.
  const handleVersionChange = useCallback(
    (requirementId: string, version: number) => {
      setGraphVersions((prev) => ({ ...prev, [requirementId]: version }));
      if (graphVisible[requirementId]) {
        void fetchGraph(requirementId, version);
      }
    },
    [fetchGraph, graphVisible],
  );

  // Auto-expand graph for the deep-linked requirement when data is loaded.
  useEffect(() => {
    if (deepLink && all.length > 0 && !loading) {
      const matchedRow = all.find(
        (row) => row.requirementId.toLowerCase() === deepLink.toLowerCase() ||
                 row.title.toLowerCase().includes(deepLink.toLowerCase())
      );
      if (matchedRow && !graphVisible[matchedRow.requirementId]) {
        const versions = requirements[matchedRow.requirementId]?.versions ?? [];
        const currentVersion = versions.find((v) => v.is_current)?.version ?? 1;
        setGraphVisible((prev) => ({ ...prev, [matchedRow.requirementId]: true }));
        setGraphVersions((prev) => ({ ...prev, [matchedRow.requirementId]: currentVersion }));
        void fetchGraph(matchedRow.requirementId, currentVersion);
      }
    }
  }, [deepLink, all, loading, graphVisible, fetchGraph, requirements]);

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
          aria-label="Filter requirements"
          className="page-panel mt-6"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <RequirementSearch
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setError("");
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
            Search by requirement ID or description. All matching requirements are shown below. Use "Show graph" to view each requirement's relationship graph.
          </p>
          {query.trim() || filters.coverage.length > 0 || filters.risks.length > 0 || filters.assurances.length > 0 ? (
            <div className="mt-4">
              <TraceFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
              />
            </div>
          ) : null}
        </section>

        {matches.length > 0 ? (
          <div className="mt-4 space-y-6">
            {matches.map((row) => {
              const req = requirements[row.requirementId];
              const versions = req?.versions ?? [];
              const selectedVersion =
                graphVersions[row.requirementId] ??
                versions.find((v) => v.is_current)?.version ??
                req?.version ??
                1;
              const isGraphVisible = graphVisible[row.requirementId] ?? false;
              const graphState = requirementGraphs[row.requirementId];

              return (
                <section
                  key={row.requirementId}
                  aria-label={`Traceability for ${row.requirementId}`}
                  className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {row.requirementId}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {row.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {versions.length > 0 ? (
                        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                          <span>Version</span>
                          <select
                            value={selectedVersion}
                            onChange={(e) => handleVersionChange(row.requirementId, Number(e.target.value))}
                            className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-accent dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            {versions
                              .slice()
                              .sort((a, b) => b.version - a.version)
                              .map((v) => (
                                <option key={v.version} value={v.version}>
                                  v{v.version}{v.is_current ? " · Current" : ""}
                                </option>
                              ))}
                          </select>
                        </label>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleGraph(row.requirementId, selectedVersion)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-accent dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-4 w-4 transition-transform ${isGraphVisible ? "rotate-180" : ""}`}
                        />
                        {isGraphVisible ? "Hide graph" : "Show graph"}
                      </button>
                    </div>
                  </div>

                  <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Matrix
                  </h3>
                  <TraceMatrix
                    items={[row]}
                    onViewChain={() =>
                      document.getElementById(`trace-graph-${row.requirementId}`)?.scrollIntoView({ behavior: "smooth" })
                    }
                  />

                  {isGraphVisible ? (
                    <div id={`trace-graph-${row.requirementId}`} className="mt-6">
                      <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Relationship graph
                      </h3>
                      {graphState?.loading ? (
                        <div role="status" className="flex h-[420px] items-center justify-center gap-2 text-sm text-zinc-500">
                          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                          Loading requirement chain…
                        </div>
                      ) : graphState?.data ? (
                        <GraphErrorBoundary requirementId={row.requirementId} trace={graphState.data}>
                          <TraceGraph
                            trace={graphState.data}
                            requirementId={row.requirementId}
                          />
                        </GraphErrorBoundary>
                      ) : (
                        <div className="flex h-[420px] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                          No graph data available for this version.
                        </div>
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {query.trim()
              ? "No requirements match that search."
              : "No traceability data available. Refresh to load requirements."}
          </section>
        )}

        </>
      ) : null}
    </DashboardLayout>
  );
}
