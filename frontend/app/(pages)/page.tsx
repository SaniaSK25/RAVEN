"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import AttentionItem from "@/components/AttentionItem";
import DashboardLayout from "@/components/DashboardLayout";
import DistributionSection from "@/components/DistributionSection";
import SummaryCard from "@/components/SummaryCard";
import {
  backendFetch,
  type BackendAssessmentRecord,
  type BackendAssuranceRecord,
  type BackendChangeEvent,
  type BackendOrphans,
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
  attention: Array<{ id: string; title: string; description: string; count: number }>;
}

function computeDashboard(
  requirements: BackendPage<BackendRequirement>,
  assessments: BackendPage<BackendAssessmentRecord>,
  assurance: BackendPage<BackendAssuranceRecord>,
  matrix: BackendTraceMatrix,
  orphans: BackendOrphans,
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

  const orphanReqs = orphans.orphans.filter((o) => o.entity_type === "requirement").length;
  const orphanTests = orphans.orphans.filter((o) => o.entity_type === "test").length;

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
    attention: [
      {
        id: "stale-assessments",
        title: "Assessments need review",
        description: "Stale or draft assessments awaiting QA follow-up.",
        count: needsReview,
      },
      {
        id: "changed-since-assessment",
        title: "Requirements changed since assessment",
        description: "Open change events need re-assessment or acceptance.",
        count: changed,
      },
      {
        id: "orphan-requirements",
        title: "Requirements without coverage",
        description: "Orphan requirements have no fresh test or assurance.",
        count: orphanReqs,
      },
      {
        id: "orphan-tests",
        title: "Tests without a requirement",
        description: "Orphan tests verify no active requirement.",
        count: orphanTests,
      },
    ],
  };
}

export default function Home() {
  const [data, setData] = useState<DashboardNumbers | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedAttempt, setLoadedAttempt] = useState(-1);
  const [error, setError] = useState<{ attempt: number; message: string } | null>(null);
  const loading = loadedAttempt !== loadAttempt && error?.attempt !== loadAttempt;
  const loadError = error?.attempt === loadAttempt ? error.message : null;

  useEffect(() => {
    let active = true;
    Promise.all([
      backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500"),
      backendFetch<BackendPage<BackendAssessmentRecord>>("assessments?limit=500"),
      backendFetch<BackendPage<BackendAssuranceRecord>>("assurance?limit=500"),
      backendFetch<BackendTraceMatrix>("traceability/matrix"),
      backendFetch<BackendOrphans>("traceability/orphans"),
      backendFetch<BackendChangeEvent[]>("changes"),
    ])
      .then(([requirements, assessments, assurance, matrix, orphans, changes]) => {
        if (active) {
          setData(computeDashboard(requirements, assessments, assurance, matrix, orphans, changes));
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError({
            attempt: loadAttempt,
            message:
              cause instanceof Error ? cause.message : "Could not load dashboard data.",
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
            <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              No requirements yet. Add your first requirement on the{" "}
              <a href="/ingestion" className="font-medium underline">
                Ingestion
              </a>{" "}
              page, then run analysis from a requirement detail page.
            </section>
          ) : null}

          {/* Summary cards */}
          <section
            aria-label="Summary"
            className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            <SummaryCard
              label="Requirements"
              value={data.totalRequirements}
              subtext="In scope for this release"
              tone="brand"
            />
            <SummaryCard
              label="Scripted"
              value={data.scripted}
              subtext="Full scripted assurance"
              tone="success"
            />
            <SummaryCard
              label="Exploratory"
              value={data.exploratory}
              subtext="Exploratory assurance"
              tone="sky"
            />
            <SummaryCard
              label="Unscripted"
              value={data.unscripted}
              subtext="Low-risk unscripted assurance"
              tone="slate"
            />
            <SummaryCard
              label="Needs Review"
              value={data.needsReview}
              subtext="Stale or draft assessments"
              tone="warning"
            />
            <SummaryCard
              label="Changed"
              value={data.changed}
              subtext="Open change events"
              tone="brand"
            />
            <SummaryCard
              label="Uncovered"
              value={data.uncovered}
              subtext="Requirements without coverage"
              tone="danger"
            />
          </section>

          {/* Distributions */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DistributionSection
              title="Risk Distribution"
              description="Current-version assessments grouped by risk band."
              rows={[
                {
                  key: "low",
                  label: "LOW",
                  value: data.riskLow,
                  barClassName: "bg-emerald-500",
                  badgeClassName:
                    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                },
                {
                  key: "medium",
                  label: "MEDIUM",
                  value: data.riskMedium,
                  barClassName: "bg-amber-400",
                  badgeClassName:
                    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
                },
                {
                  key: "high",
                  label: "HIGH",
                  value: data.riskHigh,
                  barClassName: "bg-red-500",
                  badgeClassName:
                    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
                },
              ]}
            />
            <DistributionSection
              title="Assurance Distribution"
              description="Current-version decisions grouped by assurance outcome."
              rows={[
                {
                  key: "scripted",
                  label: "SCRIPTED",
                  value: data.scripted,
                  barClassName: "bg-zinc-900 dark:bg-zinc-100",
                  badgeClassName:
                    "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
                },
                {
                  key: "exploratory",
                  label: "EXPLORATORY",
                  value: data.exploratory,
                  barClassName: "bg-sky-500",
                  badgeClassName:
                    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
                },
                {
                  key: "unscripted",
                  label: "UNSCRIPTED",
                  value: data.unscripted,
                  barClassName: "bg-violet-400",
                  badgeClassName:
                    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
                },
              ]}
            />
          </div>

          {/* Needs attention */}
          <section
            aria-label="Needs Attention"
            className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Needs Attention
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Items currently requiring QA follow-up.
            </p>
            <ul className="mt-5 space-y-2.5">
              {data.attention.map((item) => (
                <AttentionItem
                  key={item.id}
                  title={`${item.count} ${item.title}`}
                  description={item.description}
                  count={item.count}
                />
              ))}
            </ul>
          </section>
          <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
            Live counts only — aggregated from requirements, assessments, assurance,
            traceability and changes. This view does not run analysis.
          </p>
        </>
      ) : null}
    </DashboardLayout>
  );
}
