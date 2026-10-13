import DashboardLayout from "@/components/DashboardLayout";

export default function CompliancePage() {
  return (
    <DashboardLayout>
      <div className="page-header-shell">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Regulatory registry
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Compliance
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Regulatory coverage workspace — obligations, supporting evidence, and named gaps.
        </p>
      </div>

      <section className="page-panel mt-6 text-sm text-zinc-600 dark:text-zinc-300">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Compliance registry not connected yet
        </h2>
        <p className="mt-2">
          The backend has a <code>compliance_results</code> table, but no analysis writes
          framework verdicts to it yet and no compliance endpoint exists. This page will
          list real clause coverage once compliance analysis is implemented.
        </p>
        <p className="mt-2">
          Until then, use{" "}
          <a href="/traceability" className="font-medium underline">
            Traceability
          </a>{" "}
          for requirement‑to‑test coverage.
        </p>
      </section>
    </DashboardLayout>
  );
}
