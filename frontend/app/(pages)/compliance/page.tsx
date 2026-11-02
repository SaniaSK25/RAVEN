"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  LoaderCircle,
  MinusCircle,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { backendFetch } from "@/lib/backend-api";

type Verdict = "COVERED" | "PARTIALLY_COVERED" | "ABSENT";
type RunStatus = "NOT_RUN" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

type ControlAreaResult = {
  verdict: Verdict;
  fully_covered_requirements: string[];
  partially_covered_requirements: string[];
};

type ClassificationResult = {
  assessment_status: "COMPLETED";
  control_areas: Record<string, ControlAreaResult>;
  requirements_count: number;
  matching_lists_exhaustive: false;
  requirement_routes: Record<string, string>;
};

type AssessmentRun = {
  id?: string;
  assessment_status: RunStatus;
  requested_count?: number;
  total_batches?: number;
  completed_batches?: number;
  current_batch?: number | null;
  requirements_processed?: number;
  requirements_count?: number | null;
  matching_lists_exhaustive?: false | null;
  control_areas?: ClassificationResult["control_areas"] | null;
  requirement_routes?: Record<string, string>;
  error?: string | null;
};

const AREA_LABELS: Record<string, string> = {
  audit_trail: "Audit trail",
  e_signature: "Electronic signature",
  access_control: "Access control",
  record_retention: "Record retention",
  data_integrity: "Data integrity",
};

const STATUS_STYLE: Record<
  Verdict,
  { label: string; icon: typeof CheckCircle2; classes: string }
> = {
  COVERED: {
    label: "Covered",
    icon: CheckCircle2,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  PARTIALLY_COVERED: {
    label: "Partially covered",
    icon: MinusCircle,
    classes: "border-amber-200 bg-amber-50 text-amber-700",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    classes: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export default function CompliancePage() {
  const [run, setRun] = useState<AssessmentRun | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRunning = run?.assessment_status === "QUEUED" || run?.assessment_status === "RUNNING";

  useEffect(() => {
    let active = true;
    void backendFetch<AssessmentRun>("compliance/report")
      .then((latest) => {
        if (active) {
          setRun(latest);
          if (latest.assessment_status === "FAILED") {
            setError(latest.error ?? "The classification did not complete.");
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load assessment status.");
        }
      })
      .finally(() => {
        if (active) setLoadingReport(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!run?.id || (run.assessment_status !== "QUEUED" && run.assessment_status !== "RUNNING")) {
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const latest = await backendFetch<AssessmentRun>(`compliance/runs/${run.id}`);
        if (!active) return;
        setRun(latest);
        if (latest.assessment_status === "FAILED") {
          setError(latest.error ?? "The classification did not complete.");
        } else if (latest.assessment_status === "QUEUED" || latest.assessment_status === "RUNNING") {
          timer = setTimeout(() => void poll(), 1000);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not retrieve classification progress.");
        }
      }
    };
    timer = setTimeout(() => void poll(), 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [run?.id, run?.assessment_status]);

  const startAssessment = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const created = await backendFetch<AssessmentRun>("compliance/evaluate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setRun(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start classification.");
    } finally {
      setStarting(false);
    }
  }, []);

  const result =
    !starting &&
    run?.assessment_status === "COMPLETED" &&
    run.control_areas &&
    run.requirements_count !== null &&
    run.requirements_count !== undefined
      ? {
          control_areas: run.control_areas,
          requirements_count: run.requirements_count,
          matching_lists_exhaustive: false as const,
          requirement_routes: run.requirement_routes ?? {},
        }
      : null;
  const progressTotal = run?.total_batches ?? 0;
  const progressDone = run?.completed_batches ?? 0;

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              Requirement wording classification
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Control-area coverage
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void startAssessment()}
            disabled={starting || isRunning || loadingReport}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-60"
          >
            {starting || isRunning ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {isRunning
              ? "Classifying…"
              : result
                ? "Rerun classification"
                : "Run Requirement Classification"}
          </button>
        </div>
      </div>

      {error ? (
        <section
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            {run?.assessment_status === "FAILED"
              ? "Assessment incomplete"
              : "Could not load assessment"}
          </p>
          <p className="mt-1">{error}</p>
        </section>
      ) : null}

      {isRunning ? (
        <section
          className="page-panel mt-6"
          aria-live="polite"
          data-testid="assessment-progress"
        >
          <div className="flex items-center gap-3">
            <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-accent" />
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Classifying requirement wording…
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Batch {run?.current_batch ?? Math.min(progressDone + 1, progressTotal)} of up to{" "}
                {progressTotal} · {run?.requirements_processed ?? 0} of{" "}
                {run?.requested_count ?? 0} requirements processed
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{
                width: `${progressTotal ? Math.min((progressDone / progressTotal) * 100, 100) : 5}%`,
              }}
            />
          </div>
        </section>
      ) : null}

      {result ? (
        <>
          <section
            aria-label="Control-area results"
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
          >
            {Object.entries(result.control_areas).map(([key, area]) => {
              const status = STATUS_STYLE[area.verdict];
              const StatusIcon = status.icon;
              const fullCount = area.fully_covered_requirements.length;
              const partialCount = area.partially_covered_requirements.length;
              return (
                <article
                  key={key}
                  className="page-panel flex min-h-44 flex-col transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {AREA_LABELS[key] ?? key}
                  </p>
                  <span
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {fullCount > 0 ? (
                      <div className="min-w-[7rem] rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                        <p className="text-lg font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
                          {fullCount}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                          full {fullCount === 1 ? "match" : "matches"}
                        </p>
                      </div>
                    ) : null}
                    {partialCount > 0 ? (
                      <div className="min-w-[7rem] rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/30">
                        <p className="text-lg font-semibold leading-5 text-amber-700 dark:text-amber-300">
                          {partialCount}
                        </p>
                        <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
                          partial {partialCount === 1 ? "match" : "matches"}
                        </p>
                      </div>
                    ) : null}
                    {fullCount === 0 && partialCount === 0 ? (
                      <p className="self-end text-sm text-zinc-500 dark:text-zinc-400">
                        No matches discovered
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="page-panel mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Discovered requirement matches
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Matches are discovered as requirements are reviewed, so lists may not
                  include every possible match.
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                {result.requirements_count} requirements
              </p>
            </div>
            <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
              {Object.entries(result.control_areas).map(([key, area]) => (
                <div key={key} className="py-5 first:pt-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {AREA_LABELS[key] ?? key}
                  </h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {[
                      {
                        label: "Full matches",
                        requirements: area.fully_covered_requirements,
                        color: "emerald",
                      },
                      {
                        label: "Partial matches",
                        requirements: area.partially_covered_requirements,
                        color: "amber",
                      },
                    ].map(({ label, requirements, color }) => (
                      <div key={label}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {label} <span className="font-normal">({requirements.length})</span>
                        </p>
                        {requirements.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {requirements.map((requirement) => (
                              <Link
                                key={requirement}
                                href={`/requirements/${encodeURIComponent(result.requirement_routes[requirement] ?? requirement)}`}
                                className={`group inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                                  color === "emerald"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                                    : "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50"
                                }`}
                                title={`Open requirement ${requirement}`}
                              >
                                {requirement}
                                <ArrowUpRight aria-hidden="true" className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-400 dark:text-zinc-500">None found</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </>
      ) : null}

      {!loadingReport && !isRunning && !result && run?.assessment_status !== "FAILED" && !error ? (
        <section className="page-panel mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          No classification has been run. Select “Run Requirement Classification” when
          you are ready; opening this page will not send an LLM request.
        </section>
      ) : null}
    </DashboardLayout>
  );
}
