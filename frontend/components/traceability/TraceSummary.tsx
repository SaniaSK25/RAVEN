import type { TraceMatrixRow } from "@/lib/traceability-data";
import type { OrphanArtifact } from "@/lib/traceability-data";

interface TraceSummaryProps {
  rows: TraceMatrixRow[];
  orphans: OrphanArtifact[];
}

/** Compact summary strip — deliberately plain, not another dashboard. */
export default function TraceSummary({ rows, orphans }: TraceSummaryProps) {
  const stats: Array<{ label: string; value: number }> = [
    { label: "Total Requirements", value: rows.length },
    { label: "Fully Covered", value: rows.filter((r) => r.coverage === "Covered").length },
    { label: "Needs Review", value: rows.filter((r) => r.coverage === "Needs Review").length },
    {
      label: "Missing Coverage",
      value: rows.filter((r) => r.coverage === "Missing" || r.coverage === "Stale").length,
    },
    { label: "Orphans", value: orphans.length },
  ];

  return (
    <dl
      aria-label="Traceability summary"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-800"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white px-4 py-3.5 dark:bg-zinc-950">
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</dt>
          <dd className="mt-0.5 text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
