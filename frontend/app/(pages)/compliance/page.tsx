"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, MinusCircle, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { backendFetch } from "@/lib/backend-api";

type ComplianceResult = {
  clause: string;
  title: string;
  summary: string;
  status: "COVERED" | "PARTIALLY_COVERED" | "ABSENT";
  coverage: number;
  matched_requirement_keys: string[];
  explanation: string;
  named_gap: string | null;
};

type ComplianceReport = {
  framework: string;
  requirement_count: number;
  summary: Record<string, number>;
  results: ComplianceResult[];
  llm_note: string;
};

const statusCopy = {
  COVERED: { label: "Covered", icon: CheckCircle2, classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  PARTIALLY_COVERED: { label: "Partially covered", icon: MinusCircle, classes: "border-amber-200 bg-amber-50 text-amber-700" },
  ABSENT: { label: "Absent", icon: AlertCircle, classes: "border-rose-200 bg-rose-50 text-rose-700" },
};

export default function CompliancePage() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(
        await backendFetch<ComplianceReport>("compliance/evaluate", {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Annex 11 review could not be run.");
    } finally {
      setLoading(false);
    }
  }, []);

  // The Annex 11 scan is deterministic and cheap (keyword check, no LLM call),
  // so it runs automatically on page open; the button re-runs it to refresh
  // after requirement changes.
  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Requirements-only review</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">Annex 11 coverage</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">Checks whether the current LIMS requirement set asks for key Annex 11 controls. This is a requirements gap review, not proof that the implemented system is compliant.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadReport()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-60">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? "Reviewing…" : report ? "Re-run Annex 11 review" : "Run Annex 11 review"}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="page-panel mt-6 border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</div>}

      {!report && loading && (
        <section className="page-panel mt-6 flex items-center gap-3">
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-accent" />
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Reviewing the current requirement set…</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">RAVEN is scanning all active requirements against EU GMP Annex 11.</p>
          </div>
        </section>
      )}

      {report && (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-4">
            <Summary label="Requirements reviewed" value={report.requirement_count} />
            <Summary label="Clauses covered" value={report.summary.COVERED ?? 0} tone="green" />
            <Summary label="Clauses partially covered" value={report.summary.PARTIALLY_COVERED ?? 0} tone="amber" />
            <Summary label="Clauses absent" value={report.summary.ABSENT ?? 0} tone="rose" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:col-span-4">
              All {report.requirement_count} requirements are scanned against every clause below. A requirement appears under a clause only when its wording asks for that control — it can match several clauses or none.
            </p>
          </section>

          <section className="page-panel mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{report.framework}</p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Clause-by-clause requirement coverage</h2>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Wording review only</span>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {report.results.map((result) => {
                const status = statusCopy[result.status];
                const Icon = status.icon;
                return (
                  <article key={result.clause} className="py-5 first:pt-6 last:pb-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">§ {result.clause}</span>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{result.title}</h3>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{result.summary}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}><Icon className="h-3.5 w-3.5" />{status.label}</span>
                    </div>
                    <div className="mt-4 grid gap-3 pl-0 sm:grid-cols-[1fr_1.2fr] sm:pl-[60px]">
                      <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">{result.explanation}</div>
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase">Matching requirements</p>
                        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">{result.matched_requirement_keys.length ? result.matched_requirement_keys.join(", ") : "None found"}</p>
                        {result.named_gap && <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">Gap: {result.named_gap}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

    </DashboardLayout>
  );
}

function Summary({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "green" | "amber" | "rose" }) {
  const colors = { default: "text-zinc-900 dark:text-zinc-50", green: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700" };
  return <div className="page-panel"><p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{label}</p><p className={`mt-2 text-3xl font-semibold ${colors[tone]}`}>{value}</p></div>;
}
