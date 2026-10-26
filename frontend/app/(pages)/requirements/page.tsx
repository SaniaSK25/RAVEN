"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FileSearch, LoaderCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import { backendFetch, type BackendPage, type BackendRequirement } from "@/lib/backend-api";

export default function RequirementsPage() {
  const [data, setData] = useState<BackendPage<BackendRequirement> | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRequirements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load requirements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500")
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load requirements.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const search = query.trim().toLowerCase();
  const matches = (data?.items ?? [])
    .filter((item) =>
      !search ||
      `${item.req_key ?? ""} ${item.description}`.toLowerCase().includes(search),
    )
    .sort((left, right) => {
      if (!search) return 0;
      const leftKey = (left.req_key ?? "").toLowerCase();
      const rightKey = (right.req_key ?? "").toLowerCase();
      const score = (item: BackendRequirement, key: string) => {
        const text = item.description.toLowerCase();
        if (key === search) return 0;
        if (key.startsWith(search)) return 1;
        if (key.includes(search)) return 2;
        if (text.startsWith(search)) return 3;
        return 4;
      };
      return score(left, leftKey) - score(right, rightKey);
    });
  const items = search ? matches.slice(0, 5) : matches;

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Backend records
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Requirements
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {data ? `${data.total} requirements` : "Loading requirements"}
        </p>
      </div>

      <section
        aria-label="Search requirements"
        className="page-panel mt-6"
      >
        <RequirementSearch value={query} onChange={setQuery} />
        {search && matches.length > 0 ? (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Showing the {items.length} most relevant of {matches.length} matches.
          </p>
        ) : null}
      </section>

      <section
        aria-label="Requirements list"
        className="page-table-shell mt-4"
      >
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-zinc-500">
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            Loading requirements from RAVEN…
          </div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
            <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-600" />
            <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Could not load requirements
            </h2>
            <p className="mt-1 max-w-lg text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
            <button
              type="button"
              onClick={() => void loadRequirements()}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-accent dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <FileSearch aria-hidden="true" className="h-6 w-6 text-zinc-400" />
            <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {query ? "No requirements match" : "No requirements yet"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {query
                ? "Try another key or phrase."
                : "Use Ingestion to add requirements from a CSV or JSON file."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-5 py-3">Requirement</th>
                  <th scope="col" className="px-5 py-3">Version</th>
                  <th scope="col" className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="max-w-2xl px-5 py-4">
                      <Link
                        href={`/requirements/${encodeURIComponent(item.req_key ?? item.id)}`}
                        className="whitespace-pre-wrap break-words rounded font-medium text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-zinc-100"
                      >
                        {item.description || item.text}
                      </Link>
                      <span className="mt-1 block font-mono text-xs text-zinc-500">
                        {item.req_key ?? item.id}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                      {item.version ? `v${item.version}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
