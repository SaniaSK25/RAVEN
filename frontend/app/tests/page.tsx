"use client";

import { useMemo, useState } from "react";
import { FileSearch, FlaskConical } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import NonScriptedList from "@/components/tests/NonScriptedList";
import TestsFilters, { type TestFilterState } from "@/components/tests/TestsFilters";
import TestsSummary from "@/components/tests/TestsSummary";
import TestsTable from "@/components/tests/TestsTable";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import {
  compareTestStatus,
  getNonScriptedTests,
  getTestsDemoData,
  type TestSortDir,
  type TestSortKey,
} from "@/lib/tests-data";

const EMPTY_FILTERS: TestFilterState = { types: [], statuses: [], assurances: [] };

export default function TestsPage() {
  const all = useMemo(() => getTestsDemoData(), []);
  const nonScripted = useMemo(() => getNonScriptedTests(), []);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TestFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<TestSortKey>("testId");
  const [sortDir, setSortDir] = useState<TestSortDir>("asc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filters.types.length > 0 && !filters.types.includes(item.type)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
        return false;
      }
      if (filters.assurances.length > 0 && !filters.assurances.includes(item.assurance)) {
        return false;
      }
      if (q) {
        const haystack =
          `${item.testId} ${item.requirementId} ${item.requirementTitle} ${item.purpose}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "requirementId":
          return (
            a.requirementId.localeCompare(b.requirementId) * dir ||
            a.testId.localeCompare(b.testId) * dir
          );
        case "steps":
          return (a.steps.length - b.steps.length) * dir;
        case "status":
          return compareTestStatus(a.status, b.status) * dir || a.testId.localeCompare(b.testId);
        default:
          return a.testId.localeCompare(b.testId) * dir;
      }
    });
  }, [all, query, filters, sortKey, sortDir]);

  const hasActiveSearchOrFilters =
    query.trim() !== "" ||
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.assurances.length > 0;

  function handleSortChange(key: TestSortKey) {
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
          Tests
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Test workspace — formal scripted tests and the requirements they verify.
        </p>
      </div>

      <div className="mt-6">
        <TestsSummary tests={all} />
      </div>

      <section
        aria-label="Search and filter"
        className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4">
          <RequirementSearch value={query} onChange={setQuery} />
          <TestsFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
          />
        </div>
      </section>

      <section
        aria-label="Tests list"
        className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {all.length === 0 ? (
          <EmptyState
            title="No tests yet"
            description="No formal tests have been recorded. Tests appear here once scripted requirements are covered."
            actionLabel={null}
            onAction={null}
          />
        ) : visible.length > 0 ? (
          <TestsTable
            items={visible}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <EmptyState
            title={query.trim() !== "" ? "No tests match your search" : "No tests match these filters"}
            description="Try a different test ID, requirement, or keyword — or remove some filters."
            actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
            onAction={hasActiveSearchOrFilters ? handleClearAll : null}
          />
        )}
      </section>

      {visible.length > 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Showing {visible.length} of {all.length} tests. Expand a test for full inspection, or select a requirement to open its tests section.
        </p>
      ) : null}

      <NonScriptedList items={nonScripted} />

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo data — not connected. No test execution, result capture, or approvals run from this page.
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
  const Icon = actionLabel ? FileSearch : FlaskConical;
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
