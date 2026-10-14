"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Download, LoaderCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  backendFetch,
  type BackendPage,
  type BackendRequirement,
  type BackendTest,
} from "@/lib/backend-api";

export default function ExportsPage() {
  const [counts, setCounts] = useState<{ requirements: number; tests: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      backendFetch<BackendPage<BackendRequirement>>("requirements?limit=1"),
      backendFetch<BackendPage<BackendTest>>("tests?limit=1"),
    ])
      .then(([requirements, tests]) => {
        if (active) setCounts({ requirements: requirements.total, tests: tests.total });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load counts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleDownloadMatrix() {
    setDownloading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/traceability/matrix/export", { cache: "no-store" });
      if (!response.ok) throw new Error(`Export failed (${response.status}).`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "traceability-matrix.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not download the matrix.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Audit package
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Exports
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Audit-package workspace — download live backend records as CSV.
        </p>
      </div>

      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          Loading export counts from RAVEN…
        </div>
      ) : error && !counts ? (
        <section
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-zinc-950"
        >
          <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
            Exports could not be loaded
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
        </section>
      ) : (
        <section className="page-panel mt-6">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Traceability matrix (CSV)
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {counts
              ? `${counts.requirements} requirements · ${counts.tests} tests in the backend.`
              : "Live backend export."}{" "}
            Generated server-side from the current traceability snapshot.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleDownloadMatrix()}
            disabled={downloading}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-brand hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            {downloading ? "Preparing…" : "Download matrix CSV"}
          </button>
        </section>
      )}
    </DashboardLayout>
  );
}
