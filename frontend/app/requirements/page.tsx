"use client";

import { useMemo, useState } from "react";
import { FileSearch } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementFilters, {
  type RequirementFilterState,
} from "@/components/requirements/RequirementFilters";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import RequirementsTable from "@/components/requirements/RequirementsTable";
import {
  compareVersions,
  getRequirementsDemoData,
} from "@/lib/requirements-data";
import type { SortDir, SortKey } from "@/lib/requirements-data";
import type { RequirementStatus } from "@/lib/domain";

const EMPTY_FILTERS: RequirementFilterState = {
  risks: [],
  assurances: [],
  statuses: [],
};

// NOTE (v2 pagination insertion point): filtering + sorting below return the
// full visible list. When the real API supports larger datasets, add a
// page/pageSize slice here without changing the filter/sort logic above it.

export default function RequirementsPage() {
  const all = useMemo(() => getRequirementsDemoData(), []);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RequirementFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const availableStatuses = useMemo<RequirementStatus[]>(() => {
    const seen = new Set<RequirementStatus>();
    for (const item of all) seen.add(item.status);
    const order: RequirementStatus[] = ["current", "needs-review", "warning", "stale"];
    return [
      ...order.filter((s) => seen.has(s)),
      ...[...seen].filter((s) => !order.includes(s)),
    ];
  }, [all]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filters.risks.length > 0 && !filters.risks.includes(item.risk)) {
        return false;
      }
      if (
        filters.assurances.length > 0 &&
        !filters.assurances.includes(item.assurance)
      ) {
        return false;
      }
      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(item.status)
      ) {
        return false;
      }
      if (q) {
        const haystack = `${item.id} ${item.title}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "rpn") return (a.rpn - b.rpn) * dir;
      if (sortKey === "version") return compareVersions(a.version, b.version) * dir;
      return a.id.localeCompare(b.id) * dir;
    });
  }, [all, query, filters, sortKey, sortDir]);

  const attentionCount = useMemo(
    () =>
      all.filter(
        (item) =>
          item.status === "needs-review" ||
          item.status === "warning" ||
          item.status === "stale",
      ).length,
    [all],
  );

  const hasActiveSearchOrFilters =
    query.trim() !== "" ||
    filters.risks.length > 0 ||
    filters.assurances.length > 0 ||
    filters.statuses.length > 0;

  function handleSortChange(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleClearAll() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Requirements
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {visible.length} of {all.length} requirements
          <span aria-hidden="true"> · </span>
          <span>{attentionCount} need attention</span>
        </p>
      </div>

      <section
        aria-label="Search and filter"
        className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4">
          <RequirementSearch value={query} onChange={setQuery} />
          <RequirementFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            availableStatuses={availableStatuses}
          />
        </div>
      </section>

      <section
        aria-label="Requirements list"
        className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {visible.length > 0 ? (
          <RequirementsTable
            items={visible}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
            >
              <FileSearch className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              No requirements match
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Try a different ID or keyword, or remove some filters to see more
              of the list.
            </p>
            {hasActiveSearchOrFilters ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Clear search and filters
              </button>
            ) : null}
          </div>
        )}
      </section>

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo data — not connected. Select a row to open its detail view.
      </p>
    </DashboardLayout>
  );
}
