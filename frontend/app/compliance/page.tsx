"use client";

import { useMemo, useState } from "react";
import { FileSearch, Scale } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ComplianceFilters, {
  type ComplianceFilterState,
} from "@/components/compliance/ComplianceFilters";
import ComplianceSummary from "@/components/compliance/ComplianceSummary";
import ComplianceTable from "@/components/compliance/ComplianceTable";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import {
  compareCoverageStatus,
  getComplianceDemoData,
  type ComplianceSortDir,
  type ComplianceSortKey,
} from "@/lib/compliance-data";

const EMPTY_FILTERS: ComplianceFilterState = { regulations: [], statuses: [] };

export default function CompliancePage() {
  const all = useMemo(() => getComplianceDemoData(), []);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ComplianceFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<ComplianceSortKey>("criterion");
  const [sortDir, setSortDir] = useState<ComplianceSortDir>("asc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filters.regulations.length > 0 && !filters.regulations.includes(item.regulation)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
        return false;
      }
      if (q) {
        const haystack = [
          item.id,
          item.code,
          item.title,
          item.regulation,
          ...item.supporting.flatMap((s) => [s.requirementId, s.title]),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "status") {
        return compareCoverageStatus(a.status, b.status) * dir || a.code.localeCompare(b.code);
      }
      return a.code.localeCompare(b.code) * dir;
    });
  }, [all, query, filters, sortKey, sortDir]);

  const hasActiveSearchOrFilters =
    query.trim() !== "" || filters.regulations.length > 0 || filters.statuses.length > 0;

  function handleSortChange(key: ComplianceSortKey) {
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
          Compliance
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Regulatory coverage workspace — obligations, supporting evidence, and named gaps.
        </p>
      </div>

      <div className="mt-6">
        <ComplianceSummary criteria={all} />
      </div>

      <section
        aria-label="Search and filter"
        className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4">
          <RequirementSearch value={query} onChange={setQuery} />
          <ComplianceFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
          />
        </div>
      </section>

      <section
        aria-label="Criteria list"
        className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {all.length === 0 ? (
          <EmptyState
            title="No criteria yet"
            description="Regulatory criteria appear here once a registry is loaded."
            actionLabel={null}
            onAction={null}
          />
        ) : visible.length > 0 ? (
          <ComplianceTable
            items={visible}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <EmptyState
            title={query.trim() !== "" ? "No criteria match your search" : "No criteria match these filters"}
            description="Try a different ID, clause, or keyword — or remove some filters."
            actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
            onAction={hasActiveSearchOrFilters ? handleClearAll : null}
          />
        )}
      </section>

      {visible.length > 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Showing {visible.length} of {all.length} criteria. Expand a criterion for evidence and gaps.
        </p>
      ) : null}

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo criteria — an illustrative subset of FDA 21 CFR Part 11 and EU GMP Annex 11,
        not a complete or authoritative registry. No analysis runs from this page.
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
  const Icon = actionLabel ? FileSearch : Scale;
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
