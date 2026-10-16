"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardCheck, FileSearch, LoaderCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import AssessmentFilters, {
  type AssessmentFilterState,
} from "@/components/assessments/AssessmentFilters";
import AssessmentSummary from "@/components/assessments/AssessmentSummary";
import AssessmentsTable from "@/components/assessments/AssessmentsTable";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import { backendFetch, type BackendAssessmentRecord, type BackendPage } from "@/lib/backend-api";
import type { RiskBand } from "@/lib/domain";
import {
  type AssessmentRecord,
  type AssessmentSortDir,
  type AssessmentSortKey,
} from "@/lib/assessments-data";

const EMPTY_FILTERS: AssessmentFilterState = { risks: [], statuses: [] };

function toAssessmentRecord(record: BackendAssessmentRecord): AssessmentRecord {
  const requirementId = record.requirement_key ?? record.requirement_id;
  if (!requirementId) {
    throw new Error(`Assessment ${record.id} is missing its requirement identity.`);
  }
  let band: RiskBand | null = null;
  switch (record.band?.toUpperCase()) {
    case undefined:
    case null:
      break;
    case "LOW":
      band = "LOW";
      break;
    case "MEDIUM":
      band = "MEDIUM";
      break;
    case "HIGH":
      band = "HIGH";
      break;
    default:
      throw new Error(`Assessment ${record.id} has an unknown risk band: ${record.band}.`);
  }
  const version = record.version == null ? "Unknown" : `v${record.version}`;
  const currentVersion =
    record.current_requirement_version == null
      ? record.is_current_version
        ? version
        : "Unknown"
      : `v${record.current_requirement_version}`;
  const freshness = record.freshness.toLowerCase();

  return {
    assessmentId: record.id,
    requirementId,
    title: record.requirement_title ?? requirementId,
    severity: record.severity,
    probability: record.probability,
    detectability: record.detectability,
    severityReasoning: record.severity_reasoning,
    probabilityReasoning: record.probability_reasoning,
    detectabilityReasoning: record.detectability_reasoning,
    severityRuleId: record.severity_rule_id,
    probabilityRuleId: record.probability_rule_id,
    detectabilityRuleId: record.detectability_rule_id,
    severityDecisionPath: record.severity_decision_path,
    probabilityDecisionPath: record.probability_decision_path,
    detectabilityDecisionPath: record.detectability_decision_path,
    gampReason: record.gamp_reason,
    rpnPoints: record.rpn_points,
    rpn: record.rpn,
    band,
    status:
      freshness === "fresh" && record.is_current && record.is_current_version
        ? "fresh"
        : "stale",
    assessedVersion: version,
    currentVersion,
    ruleId: [
      record.severity_rule_id,
      record.probability_rule_id,
      record.detectability_rule_id,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" · "),
    ruleVersion: record.rule_version,
  };
}

function compareOptionalNumber(
  left: number | null,
  right: number | null,
  direction: number,
): number {
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  return (left - right) * direction;
}

export default function AssessmentsPage() {
  const [all, setAll] = useState<AssessmentRecord[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedAttempt, setLoadedAttempt] = useState(-1);
  const [error, setError] = useState<{ attempt: number; message: string } | null>(null);
  const loading = loadedAttempt !== loadAttempt && error?.attempt !== loadAttempt;
  const loadError = error?.attempt === loadAttempt ? error.message : null;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AssessmentFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<AssessmentSortKey>("id");
  const [sortDir, setSortDir] = useState<AssessmentSortDir>("asc");

  useEffect(() => {
    let active = true;
    backendFetch<BackendPage<BackendAssessmentRecord>>("assessments?limit=500")
      .then((data) => {
        const records = data.items.map(toAssessmentRecord);
        if (active) {
          setAll(records);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError({
            attempt: loadAttempt,
            message:
              cause instanceof Error
                ? cause.message
                : "Could not load persisted risk assessments.",
          });
        }
      })
      .finally(() => {
        if (active) setLoadedAttempt(loadAttempt);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (filters.risks.length > 0 && (!item.band || !filters.risks.includes(item.band))) {
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
          return compareOptionalNumber(a.rpn, b.rpn, dir);
        case "severity":
          return compareOptionalNumber(a.severity, b.severity, dir);
        case "probability":
          return compareOptionalNumber(a.probability, b.probability, dir);
        case "detectability":
          return compareOptionalNumber(a.detectability, b.detectability, dir);
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
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Backend records
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Assessments
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 sm:text-[15px] dark:text-zinc-400">
          Fresh means this assessment matches the current requirement. Stale means the requirement changed afterwards — re-run analysis from the requirement page to get a fresh result.
        </p>
      </div>

      {!loading && !loadError ? (
        <div className="mt-6">
          <AssessmentSummary assessments={all} />
        </div>
      ) : null}

      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          Loading assessments from RAVEN…
        </div>
      ) : loadError ? (
        <section role="alert" className="mt-6 rounded-lg border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
            Assessments could not be loaded
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="mt-4 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-accent dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Retry
          </button>
        </section>
      ) : (
        <>
          <section
        aria-label="Search and filter"
        className="page-panel mt-4"
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
        className="page-table-shell mt-4"
      >
        {all.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="No persisted risk assessments were found. Results appear here after the backend analysis workflow saves an assessment."
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

        </>
      )}
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
