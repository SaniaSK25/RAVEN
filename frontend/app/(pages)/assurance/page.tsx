"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileSearch, LoaderCircle, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import AssuranceFilters, {
  type AssuranceFilterState,
} from "@/components/assurance/AssuranceFilters";
import AssuranceSummary from "@/components/assurance/AssuranceSummary";
import AssuranceTable from "@/components/assurance/AssuranceTable";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import { backendFetch, type BackendAssuranceRecord, type BackendPage } from "@/lib/backend-api";
import type { AssuranceOutcome, RiskBand } from "@/lib/domain";
import {
  compareAssurance,
  type AssuranceRecord,
  type AssuranceSortDir,
  type AssuranceSortKey,
} from "@/lib/assurance-data";

const EMPTY_FILTERS: AssuranceFilterState = { assurances: [], risks: [], statuses: [], gxp: [] };

function toAssuranceRecord(record: BackendAssuranceRecord): AssuranceRecord {
  const requirementId = record.requirement_key ?? record.requirement_id;
  if (!requirementId) {
    throw new Error(`Assurance decision ${record.id} is missing its requirement identity.`);
  }
  const bandValue = record.band?.toUpperCase();
  let band: RiskBand | null = null;
  switch (bandValue) {
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
      throw new Error(`Assurance decision ${record.id} has an unknown risk band: ${record.band}.`);
  }
  let outcome: AssuranceOutcome;
  switch (record.assurance_level) {
    case "SCRIPTED":
      outcome = "scripted";
      break;
    case "EXPLORATORY":
      outcome = "exploratory";
      break;
    case "UNSCRIPTED":
      outcome = "unscripted";
      break;
    default:
      throw new Error(
        `Assurance decision ${record.id} has an unknown level: ${record.assurance_level}.`,
      );
  }
  const version = record.version == null ? "Unknown" : `v${record.version}`;
  const currentVersion =
    record.current_requirement_version == null
      ? record.is_current_version
        ? version
        : "Unknown"
      : `v${record.current_requirement_version}`;
  const decisionPath = record.decision_path
    ? Object.entries(record.decision_path).map(([key, value]) => {
        const rendered = typeof value === "string" ? value : JSON.stringify(value);
        return `${key}: ${rendered ?? String(value)}`;
      })
    : [];

  return {
    decisionId: record.id,
    requirementId,
    title: record.requirement_title ?? requirementId,
    band,
    rpn: record.rpn,
    severity: record.severity,
    gxpImpact: record.gxp_impact,
    gampCategory: record.gamp_category,
    outcome,
    reason: record.reasoning,
    ruleId: record.rule_id,
    decisionPath,
    rationale: record.reasoning,
    status:
      record.freshness.toLowerCase() !== "fresh" ||
      record.assessment_freshness?.toLowerCase() !== "fresh" ||
      !record.is_current_version
        ? "stale"
        : "current",
    assessedVersion: version,
    currentVersion,
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

export default function AssurancePage() {
  const [all, setAll] = useState<AssuranceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedAttempt, setLoadedAttempt] = useState(-1);
  const [error, setError] = useState<{ attempt: number; message: string } | null>(null);
  const loading = loadedAttempt !== loadAttempt && error?.attempt !== loadAttempt;
  const loadError = error?.attempt === loadAttempt ? error.message : null;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AssuranceFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<AssuranceSortKey>("id");
  const [sortDir, setSortDir] = useState<AssuranceSortDir>("asc");

  useEffect(() => {
    let active = true;
    backendFetch<BackendPage<BackendAssuranceRecord>>("assurance?limit=500")
      .then((data) => {
        const records = data.items.map(toAssuranceRecord);
        if (active) {
          setAll(records);
          setTotal(data.total);
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
                : "Could not load persisted assurance decisions.",
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
      if (filters.assurances.length > 0 && !filters.assurances.includes(item.outcome)) {
        return false;
      }
      if (filters.risks.length > 0 && (!item.band || !filters.risks.includes(item.band))) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
        return false;
      }
      if (filters.gxp.length > 0) {
        if (item.gxpImpact === null) return false;
        const gxp = item.gxpImpact ? "yes" : "no";
        if (!filters.gxp.includes(gxp)) return false;
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
        case "assurance":
          return compareAssurance(a.outcome, b.outcome) * dir;
        default:
          return a.requirementId.localeCompare(b.requirementId) * dir;
      }
    });
  }, [all, query, filters, sortKey, sortDir]);

  const hasActiveSearchOrFilters =
    query.trim() !== "" ||
    filters.assurances.length > 0 ||
    filters.risks.length > 0 ||
    filters.statuses.length > 0 ||
    filters.gxp.length > 0;

  function handleSortChange(key: AssuranceSortKey) {
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
          Assurance
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Persisted assurance decisions, rule explanations, and their assessment context.
        </p>
      </div>

      {!loading && !loadError ? (
        <div className="mt-6">
          <AssuranceSummary decisions={all} />
        </div>
      ) : null}

      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          Loading assurance decisions from RAVEN…
        </div>
      ) : loadError ? (
        <section role="alert" className="mt-6 rounded-lg border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
            Assurance decisions could not be loaded
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
          <AssuranceFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
          />
        </div>
      </section>

      <section
        aria-label="Assurance decisions list"
        className="page-table-shell mt-4"
      >
        {all.length === 0 ? (
          <EmptyState
            title="No assurance decisions yet"
            description="No persisted assurance decisions were found. Decisions appear here after backend analysis saves them."
            actionLabel={null}
            onAction={null}
          />
        ) : visible.length > 0 ? (
          <AssuranceTable
            items={visible}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <EmptyState
            title={query.trim() !== "" ? "No decisions match your search" : "No decisions match these filters"}
            description="Try a different ID or keyword, or remove some filters to see more of the list."
            actionLabel={hasActiveSearchOrFilters ? "Clear search and filters" : null}
            onAction={hasActiveSearchOrFilters ? handleClearAll : null}
          />
        )}
      </section>

      {visible.length > 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          Showing {visible.length} of {all.length} loaded decisions ({total} total). Expand a row for recorded reasoning, or select a requirement to open its detail.
        </p>
      ) : null}

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Live persisted decisions only. This view does not run the assurance engine or create new decisions.
      </p>
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
  const Icon = actionLabel ? FileSearch : ShieldCheck;
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
