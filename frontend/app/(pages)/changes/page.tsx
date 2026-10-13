"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, History, LoaderCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import { backendFetch, type BackendChangeEvent } from "@/lib/backend-api";

function artifactCounts(impact: Record<string, unknown>): string[] {
  return Object.entries(impact)
    .filter(([, ids]) => Array.isArray(ids) && ids.length > 0)
    .map(([kind, ids]) => `${kind}: ${(ids as unknown[]).length}`);
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export default function ChangesPage() {
  const [changes, setChanges] = useState<BackendChangeEvent[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadChanges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setChanges(await backendFetch<BackendChangeEvent[]>("changes"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load change events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    backendFetch<BackendChangeEvent[]>("changes")
      .then((result) => {
        if (active) setChanges(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load change events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = changes.filter((change) =>
    `${change.requirement_key ?? ""} ${change.requirement_title ?? ""} ${change.kind} ${change.status}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Backend records</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">Changes</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Persisted requirement changes and their stale-artifact impact.
        </p>
      </div>
      <section aria-label="Search change events" className="page-panel mt-6">
        <RequirementSearch value={query} onChange={setQuery} />
      </section>
      <section aria-label="Change events" className="mt-4 space-y-3">
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 py-14 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Loading change events…</div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-600" />
            <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">Could not load change events</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
            <button type="button" onClick={() => void loadChanges()} className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"><RefreshCw aria-hidden="true" className="h-4 w-4" />Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <History aria-hidden="true" className="h-6 w-6 text-zinc-400" />
            <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{changes.length ? "No changes match" : "No backend change events"}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{changes.length ? "Try another requirement key or event status." : "Events are recorded when an existing requirement is edited or retired."}</p>
          </div>
        ) : visible.map((change) => {
          const counts = artifactCounts(change.impact);
          return (
            <article key={change.id} className="page-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {change.requirement_key ? (
                    <Link href={`/requirements/${encodeURIComponent(change.requirement_key)}`} className="font-mono text-xs font-semibold text-accent hover:underline">{change.requirement_key}</Link>
                  ) : <span className="font-mono text-xs text-zinc-500">{change.requirement_id}</span>}
                  <h2 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{change.requirement_title ?? "Requirement change"}</h2>
                  {change.current_text ? <p className="mt-2 max-w-4xl text-sm leading-5 text-zinc-600 dark:text-zinc-300">{change.current_text}</p> : null}
                </div>
                <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium capitalize text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">{statusLabel(change.status)}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span>Action: {change.kind}</span>
                {change.current_version ? <span>Current version: v{change.current_version}</span> : null}
                <span>{change.created_at ? new Date(change.created_at).toLocaleString() : "Date unavailable"}</span>
                <span>Recorded by: {change.created_by}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Impact recorded by backend</p>
                {counts.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {counts.map((count) => <li key={count} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">{count}</li>)}
                  </ul>
                ) : <p className="mt-1 text-xs text-zinc-500">No impacted artifact IDs were recorded.</p>}
              </div>
              {change.resolution_note ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Resolution note: {change.resolution_note}</p> : null}
            </article>
          );
        })}
      </section>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Live change-event records. Re-analysis and resolution actions are not initiated from this view.
      </p>
    </DashboardLayout>
  );
}
