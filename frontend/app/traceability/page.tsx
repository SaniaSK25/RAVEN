"use client";

import { useMemo, useState } from "react";
import { FileSearch, Network } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GraphErrorBoundary from "@/components/traceability/GraphErrorBoundary";
import TraceFilters, { type TraceFilterState } from "@/components/traceability/TraceFilters";
import TraceGraph from "@/components/traceability/TraceGraph";
import TraceMatrix from "@/components/traceability/TraceMatrix";
import TraceSummary from "@/components/traceability/TraceSummary";
import OrphanList from "@/components/traceability/OrphanList";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import {
  getOrphanArtifacts,
  getTraceGraph,
  getTraceMatrix,
} from "@/lib/traceability-data";

const EMPTY_FILTERS: TraceFilterState = { coverage: [], risks: [], assurances: [] };

type TraceView = "matrix" | "graph";

export default function TraceabilityPage() {
  const all = useMemo(() => getTraceMatrix(), []);
  const orphans = useMemo(() => getOrphanArtifacts(), []);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TraceFilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<TraceView>("matrix");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const graph = graphId ? getTraceGraph(graphId) : null;

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Traceability
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Coverage and relationship workspace — what is connected to what.
        </p>
      </div>

      <div className="mt-6">
        <TraceSummary rows={all} orphans={orphans} />
      </div>

      <section
        aria-label="Search and filter"
        className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
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
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
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
            {graph && graphRow ? (
              <GraphErrorBoundary requirementId={graphRow.requirementId} trace={graph}>
                <TraceGraph trace={graph} requirementId={graphRow.requirementId} canOpenDetail={graphRow.inList} />
              </GraphErrorBoundary>
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
        Demo data — not connected. Links display recorded relationships; this page creates no edges.
      </p>
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
