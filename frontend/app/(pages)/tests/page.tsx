"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  FlaskConical,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import { cn } from "@/lib/cn";
import { backendFetch, type BackendTest } from "@/lib/backend-api";

/** Freshness is the only health signal shown on this page. */
function FreshnessBadge({ freshness }: { freshness: string }) {
  const fresh = freshness.toLowerCase() === "fresh";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        fresh
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
      )}
    >
      {fresh ? (
        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {fresh ? "Fresh" : "Stale"}
    </span>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState<BackendTest[]>([]);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTests(await backendFetch<BackendTest[]>("tests"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load tests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    backendFetch<BackendTest[]>("tests")
      .then((result) => {
        if (active) setTests(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load tests.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = tests.filter((test) =>
    `${test.external_code ?? ""} ${test.title ?? ""} ${test.requirement_key ?? ""} ${test.requirement_title}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Backend records</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">Tests</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Persisted test scripts linked to requirement versions.
        </p>
      </div>
      <section aria-label="Search tests" className="page-panel mt-6">
        <RequirementSearch value={query} onChange={setQuery} />
      </section>
      <section aria-label="Backend tests" className="page-panel mt-4 overflow-hidden">
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-zinc-500"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Loading tests…</div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
            <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-600" />
            <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">Could not load tests</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
            <button type="button" onClick={() => void loadTests()} className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"><RefreshCw aria-hidden="true" className="h-4 w-4" />Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <FlaskConical aria-hidden="true" className="h-6 w-6 text-zinc-400" />
            <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{tests.length === 0 ? "No persisted tests yet" : "No tests match"}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tests.length === 0 ? "Tests appear here after they are generated, imported, or added manually." : "Try another test code, requirement, or title."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((test) => {
              const expanded = expandedId === test.id;
              return (
                <li key={test.id}>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 sm:px-6">
                    <div className="min-w-0 flex-1 basis-64">
                      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {test.title ?? test.external_code ?? "Test script"}
                      </p>
                      <Link
                        href={`/requirements/${encodeURIComponent(test.requirement_key ?? test.requirement_id)}?tab=tests`}
                        className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm hover:opacity-80"
                      >
                        <span className="shrink-0 font-mono font-medium text-accent">
                          {test.requirement_key ?? test.requirement_id}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">{test.requirement_title}</span>
                      </Link>
                    </div>
                    <FreshnessBadge freshness={test.freshness} />
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">v{test.version}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : test.id)}
                      aria-expanded={expanded}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                        expanded
                          ? "border-accent bg-accent/10 text-accent dark:text-accent"
                          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
                      )}
                    >
                      <Code2 aria-hidden="true" className="h-4 w-4" />
                      {expanded ? "Hide script" : "View script"}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                      />
                    </button>
                  </div>
                  {expanded ? (
                    <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/60">
                      <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400">
                        Persisted test script
                      </p>
                      <pre className="mt-3 max-h-[32rem] overflow-auto rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-6 break-words whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                        {test.script}
                      </pre>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
