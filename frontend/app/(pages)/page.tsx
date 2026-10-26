"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, LoaderCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import DistributionSection from "@/components/DistributionSection";
import SummaryCard from "@/components/SummaryCard";
import {
  backendFetch,
  type BackendAssessmentRecord,
  type BackendAssuranceRecord,
  type BackendChangeEvent,
  type BackendPage,
  type BackendRequirement,
  type BackendTraceMatrix,
} from "@/lib/backend-api";

interface DashboardNumbers {
  totalRequirements: number;
  riskLow: number;
  riskMedium: number;
  riskHigh: number;
  scripted: number;
  exploratory: number;
  unscripted: number;
  needsReview: number;
  changed: number;
  uncovered: number;
}

const EMPTY_PAGE = { items: [], total: 0, skip: 0, limit: 0 };
const EMPTY_MATRIX: BackendTraceMatrix = { total: 0, rows: [] };
const EMPTY_CHANGES: BackendChangeEvent[] = [];

/** Human-readable labels for each dashboard data source, keyed to fetch order. */
const SOURCE_LABELS = [
  "requirements",
  "risk assessments",
  "assurance decisions",
  "traceability matrix",
  "change events",
] as const;

function computeDashboard(
  requirements: BackendPage<BackendRequirement>,
  assessments: BackendPage<BackendAssessmentRecord>,
  assurance: BackendPage<BackendAssuranceRecord>,
  matrix: BackendTraceMatrix,
  changes: BackendChangeEvent[],
): DashboardNumbers {
  // Risk distribution — count current-version assessments by band.
  let riskLow = 0;
  let riskMedium = 0;
  let riskHigh = 0;
  let needsReview = 0;
  for (const record of assessments.items) {
    const band = record.band?.toUpperCase();
    const current = record.is_current && record.is_current_version;
    if (current) {
      if (band === "LOW") riskLow += 1;
      else if (band === "MEDIUM") riskMedium += 1;
      else if (band === "HIGH") riskHigh += 1;
    }
    const fresh = record.freshness.toLowerCase() === "fresh";
    if (!fresh || !record.is_current || !record.is_current_version) {
      needsReview += 1;
    } else if (record.status.toUpperCase() === "DRAFT") {
      needsReview += 1;
    }
  }

  // Assurance distribution — backend knows scripted/exploratory/unscripted only.
  let scripted = 0;
  let exploratory = 0;
  let unscripted = 0;
  for (const record of assurance.items) {
    if (!record.is_current_version) continue;
    if (record.assurance_level === "SCRIPTED") scripted += 1;
    else if (record.assurance_level === "EXPLORATORY") exploratory += 1;
    else unscripted += 1;
  }

  const changed = changes.filter((change) =>
    ["open", "reanalyzed"].includes(change.status.toLowerCase()),
  ).length;

  // Coverage — rows are per test link; aggregate uncovered requirements.
  const uncoveredReqs = new Set<string>();
  for (const row of matrix.rows) {
    if (row.coverage_status === "uncovered" && typeof row.requirement_id === "string") {
      uncoveredReqs.add(row.requirement_id);
    }
  }

  return {
    totalRequirements: requirements.total,
    riskLow,
    riskMedium,
    riskHigh,
    scripted,
    exploratory,
    unscripted,
    needsReview,
    changed,
    uncovered: uncoveredReqs.size,
  };
}

export default function Home() {
  const [data, setData] = useState<DashboardNumbers | null>(null);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedAttempt, setLoadedAttempt] = useState(-1);
  const [error, setError] = useState<{ attempt: number; message: string } | null>(null);
  const loading = loadedAttempt !== loadAttempt && error?.attempt !== loadAttempt;
  const loadError = error?.attempt === loadAttempt ? error.message : null;

  useEffect(() => {
    let active = true;
    // Load each source independently so a single failing read (e.g. an empty
    // database or a flaky secondary endpoint) does not blank the whole page.
    const load = async () => {
      const settled = await Promise.allSettled([
        backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500"),
        backendFetch<BackendPage<BackendAssessmentRecord>>("assessments?limit=500"),
        backendFetch<BackendPage<BackendAssuranceRecord>>("assurance?limit=500"),
        backendFetch<BackendTraceMatrix>("traceability/matrix"),
        backendFetch<BackendChangeEvent[]>("changes"),
      ]);
      if (!active) return;

      if (settled[0].status === "rejected") {
        const cause = settled[0].reason;
        setData(null);
        setFailedSources([]);
        setError({
          attempt: loadAttempt,
          message:
            cause instanceof Error ? cause.message : "Could not load dashboard data.",
        });
        setLoadedAttempt(loadAttempt);
        return;
      }

      const values = settled.map((result, index) =>
        result.status === "fulfilled"
          ? result.value
          : index === 3
            ? EMPTY_MATRIX
            : index === 4
              ? EMPTY_CHANGES
              : EMPTY_PAGE,
      );
      setData(
        computeDashboard(
          values[0] as BackendPage<BackendRequirement>,
          values[1] as BackendPage<BackendAssessmentRecord>,
          values[2] as BackendPage<BackendAssuranceRecord>,
          values[3] as BackendTraceMatrix,
          values[4] as BackendChangeEvent[],
        ),
      );
      setFailedSources(
        settled.flatMap((result, index) =>
          result.status === "rejected" && SOURCE_LABELS[index]
            ? [SOURCE_LABELS[index]]
            : [],
        ),
      );
      setError(null);
      setLoadedAttempt(loadAttempt);
    };
    void load();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-zinc-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Live overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Regulatory QA Overview — aggregated from live backend records.
        </p>
      </div>

      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          Loading dashboard from RAVEN…
        </div>
      ) : loadError ? (
        <section
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-zinc-950"
        >
          <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
            Dashboard could not be loaded
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
      ) : data ? (
        <>
          {data.totalRequirements === 0 ? (
            <section
              className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                No requirements are currently ingested
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                The RAVEN database has no records yet. Import your first requirement
                on the{" "}
                <a href="/ingestion" className="font-medium underline">
                  Ingestion
                </a>{" "}
                page — the dashboard will fill in automatically as requirements, risk
                assessments and test coverage are added.
              </p>
            </section>
          ) : failedSources.length > 0 ? (
            <section
              role="status"
              className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                {failedSources.length} data source
                {failedSources.length === 1 ? "" : "s"} could not be loaded
              </div>
              <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
                Unavailable: {failedSources.join(", ")}. Showing counts from the
                sources that loaded successfully.
              </p>
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="mt-3 rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-accent dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950"
              >
                Retry
              </button>
            </section>
          ) : null}

          {data.totalRequirements !== 0 ? (
            <>
              {/* Summary cards */}
              <section
                aria-label="Summary"
                className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
              >
                <SummaryCard
                  label="Requirements"
                  value={data.totalRequirements}
                  subtext="Requirements currently in the system."
                  tone="brand"
                />
                <SummaryCard
                  label="Scripted testing"
                  value={data.scripted}
                  subtext="Documented test procedures for higher-risk requirements."
                  tone="success"
                />
                <SummaryCard
                  label="Exploratory testing"
                  value={data.exploratory}
                  subtext="Focused testing with recorded observations and results."
                  tone="sky"
                />
                <SummaryCard
                  label="Unscripted testing"
                  value={data.unscripted}
                  subtext="Low-risk requirements with unscripted testing."
                  tone="slate"
                />
              </section>

              {/* Distributions */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <DistributionSection
                  title="Risk Distribution"
                  description="Current assessments grouped by their risk rating."
                  totalLabel="assessments"
                  rows={[
                    {
                      key: "low",
                      label: "Low risk",
                      value: data.riskLow,
                      color: "#10b981",
                      badgeClassName:
                        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                    },
                    {
                      key: "medium",
                      label: "Medium risk",
                      value: data.riskMedium,
                      color: "#f59e0b",
                      badgeClassName:
                        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
                    },
                    {
                      key: "high",
                      label: "High risk",
                      value: data.riskHigh,
                      color: "#ef4444",
                      badgeClassName:
                        "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
                    },
                  ]}
                />
                <DistributionSection
                  title="Assurance Distribution"
                  description="Current decisions grouped by the level of testing required."
                  totalLabel="assurance decisions"
                  rows={[
                    {
                      key: "scripted",
                      label: "Scripted testing",
                      value: data.scripted,
                      color: "#52525b",
                      badgeClassName:
                        "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
                    },
                    {
                      key: "exploratory",
                      label: "Exploratory testing",
                      value: data.exploratory,
                      color: "#0ea5e9",
                      badgeClassName:
                        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
                    },
                    {
                      key: "unscripted",
                      label: "Unscripted testing",
                      value: data.unscripted,
                      color: "#8b5cf6",
                      badgeClassName:
                        "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
                    },
                  ]}
                />
              </div>

            </>
          ) : null}
        </>
      ) : null}
    </DashboardLayout>
  );
}
