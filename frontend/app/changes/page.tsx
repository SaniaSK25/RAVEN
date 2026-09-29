"use client";

import { useMemo, useState } from "react";
import { FileSearch, History } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ChangesFilters, { type ChangeFilterState } from "@/components/changes/ChangesFilters";
import ChangesSummary from "@/components/changes/ChangesSummary";
import ChangesTable from "@/components/changes/ChangesTable";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import {
  getChangedRequirementIds,
  getChangesDemoData,
  type ChangeSortDir,
  type ChangeSortKey,
} from "@/lib/changes-data";

const EMPTY_FILTERS: ChangeFilterState = { statuses: [], requirementIds: [], impactKinds: [] };

const STATUS_RANK: Record<string, number> = {
  "RE-ANALYSIS REQUIRED": 0,
  "NEEDS REVIEW": 1,
  "CONFIRMED VALID": 2,
  ACCEPTED: 3,
};

export default function ChangesPage() {
  const all = useMemo(() => getChangesDemoData(), []);
  const requirementOptions = useMemo(() => getChangedRequirementIds(), []);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ChangeFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<ChangeSortKey>("date");
  const [sortDir, setSortDir] = useState<ChangeSortDir>("desc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
        return false;
      }
      if (filters.requirementIds.length > 0 && !filters.requirementIds.includes(item.requirementId)) {
        return false;
      }
      if (
        filters.impactKinds.length > 0 &&
        !item.impacted.some((a) => filters.impactKinds.includes(a.kind))
      ) {
        return false;
      }
      if (q) {
        const haystack = `${item.requirementId} ${item.title}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "requirementId":
          return a.requirementId.localeCompare(b.requirementId) * dir || a.date.localeCompare(b.date) * dir;
        case "status":
          return (
            ((STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)) * dir ||
            b.date.localeCompare(a.date)
          );
        default:
          return a.date.localeCompare(b.date) * dir;
      }
    });
  }, [all, query, filters, sortKey, sortDir]);

  const hasActiveSearchOrFilters =
    query.trim() !== "" ||
    filters.statuses.length > 0 ||
    filters.requirementIds.length > 0 ||
    filters.impactKinds.length > 0;

  function handleSortChange(key: ChangeSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
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
          Changes
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Change-impact review queue — what changed, what went stale, and what to do.
        </p>
      </div>

      <div className="mt-6">
        <ChangesSummary changes={all} />
      </div>

      <section
        aria-label="Search and filter"
        className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4">
          <RequirementSearch value={query} onChange={setQuery} />
          <ChangesFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            requirementOptions={requirementOptions}
          />
        </div>
      </section>

      <section
        aria-label="Change events list"
        className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {all.length === 0 ? (
          <EmptyState
            title="No changes recorded"
            description="Change events appear here once requirements are revised."
            actionLabel={null}
            onAction={null}
          />
        ) : visible.length > 0 ? (
          <ChangesTable
            items={visible}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <EmptyState
            title={query.trim() !== "" ? "No changes match your search" : "No changes match these filters"}
            description="Try a different ID or keyword, or remove some filters to see more of the queue."
            actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
            onAction={hasActiveSearchOrFilters ? handleClearAll : null}
          />
        )}
      </section>

      {visible.length > 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Showing {visible.length} of {all.length} change events. Expand a change to review impact and act.
        </p>
      ) : null}

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo data — not connected. Review actions are local only; confirming or queueing
        re-analysis starts no backend work.
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
  const Icon = actionLabel ? FileSearch : History;
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
