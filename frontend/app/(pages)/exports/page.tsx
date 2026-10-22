"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Archive, LoaderCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ValidationPackExport from "@/components/exports/ValidationPackExport";
import { backendFetch } from "@/lib/backend-api";

export default function ExportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    backendFetch("requirements?limit=1")
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not connect to the backend.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Audit package</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">Exports</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Assemble a review-ready validation pack from selected requirements.
        </p>
      </div>

      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> Loading export workspace...
        </div>
      ) : error ? (
        <section role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" /> Exports could not be loaded</div>
          <p className="mt-2 text-sm">{error}</p>
        </section>
      ) : (
        <section className="page-panel mt-6 overflow-hidden border-0 bg-transparent p-0 shadow-none">
          <div className="mb-5 flex items-start gap-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg">
            <div className="rounded-xl bg-white/10 p-3"><Archive className="h-6 w-6 text-blue-200" /></div>
            <div>
              <h2 className="text-xl font-semibold">Validation Pack</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100/80">
                Search and select requirements above the list, then generate the pack. The ZIP includes the consolidated PDF, section PDFs, traceability CSV, evidence index, and README.
              </p>
            </div>
          </div>
          <ValidationPackExport />
        </section>
      )}
    </DashboardLayout>
  );
}
