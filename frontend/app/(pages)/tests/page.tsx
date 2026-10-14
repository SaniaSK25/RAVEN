"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FlaskConical, LoaderCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import { backendFetch, type BackendTest } from "@/lib/backend-api";

export default function TestsPage() {
  const [tests, setTests] = useState<BackendTest[]>([]);
  const [query, setQuery] = useState("");
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
      <section aria-label="Backend tests" className="page-table-shell mt-4">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <tr><th scope="col" className="px-5 py-3">Test</th><th scope="col" className="px-5 py-3">Requirement</th><th scope="col" className="px-5 py-3">Origin</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3">Version</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {visible.map((test) => (
                  <tr key={test.id}>
                    <td className="max-w-lg px-5 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{test.title ?? test.external_code ?? `TS-${test.id.slice(0, 8)}`}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-accent">View persisted script</summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{test.script}</pre>
                      </details>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/requirements/${encodeURIComponent(test.requirement_key ?? test.requirement_id)}?tab=tests`} className="font-mono text-xs text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-200">{test.requirement_key ?? test.requirement_id}</Link>
                      <p className="mt-1 max-w-xs text-xs text-zinc-500">{test.requirement_title}</p>
                    </td>
                    <td className="px-5 py-4 text-xs capitalize text-zinc-600 dark:text-zinc-300">{test.origin}</td>
                    <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-300">{test.freshness} · {test.status}</td>
                    <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-300">v{test.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Live persisted scripts only. This page does not execute tests or record results.
      </p>
    </DashboardLayout>
  );
}
