"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, FileSearch } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import AssessmentFilters, {
  type AssessmentFilterState,
} from "@/components/assessments/AssessmentFilters";
import AssessmentSummary from "@/components/assessments/AssessmentSummary";
import AssessmentsTable from "@/components/assessments/AssessmentsTable";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import {
  getAssessmentsDemoData,
  type AssessmentSortDir,
  type AssessmentSortKey,
} from "@/lib/assessments-data";

const EMPTY_FILTERS: AssessmentFilterState = { risks: [], statuses: [] };

export default function AssessmentsPage() {
  const all = useMemo(() => getAssessmentsDemoData(), []);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AssessmentFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<AssessmentSortKey>("id");
  const [sortDir, setSortDir] = useState<AssessmentSortDir>("asc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filters.risks.length > 0 && !filters.risks.includes(item.band)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
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
        case "rpn":
          return (a.rpn - b.rpn) * dir;
        case "severity":
          return (a.severity - b.severity) * dir;
        case "probability":
          return (a.probability - b.probability) * dir;
        case "detectability":
          return (a.detectability - b.detectability) * dir;
        default:
          return a.requirementId.localeCompare(b.requirementId) * dir;
      }
    });
  }, [all, query, filters, sortKey, sortDir]);

  const hasActiveSearchOrFilters =
    query.trim() !== "" || filters.risks.length > 0 || filters.statuses.length > 0;

  function handleSortChange(key: AssessmentSortKey) {
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
          Assessments
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Risk-assessment workspace — recorded Severity, Probability, Detectability, and RPN per requirement.
        </p>
      </div>

      <div className="mt-6">
        <AssessmentSummary assessments={all} />
      </div>

      <section
        aria-label="Search and filter"
        className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4">
          <RequirementSearch value={query} onChange={setQuery} />
          <AssessmentFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
          />
        </div>
      </section>

      <section
        aria-label="Assessments list"
        className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {all.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="No risk assessments have been recorded. Assessments appear here once requirements are assessed."
            actionLabel={null}
            onAction={null}
          />
        ) : visible.length > 0 ? (
          <AssessmentsTable
            items={visible}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <EmptyState
            title={query.trim() !== "" ? "No assessments match your search" : "No assessments match these filters"}
            description="Try a different ID or keyword, or remove some filters to see more of the list."
            actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
            onAction={hasActiveSearchOrFilters ? handleClearAll : null}
          />
        )}
      </section>

      {visible.length > 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Showing {visible.length} of {all.length} assessments. Select a row to open the requirement risk section.
        </p>
      ) : null}

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo data — not connected. Values display recorded rule-engine decisions; this page does not re-score risk.
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
  const Icon = actionLabel ? FileSearch : ClipboardCheck;
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
