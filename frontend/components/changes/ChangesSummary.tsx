import type { ChangeRecord } from "@/lib/changes-data";

interface ChangesSummaryProps {
  changes: ChangeRecord[];
}

/** Compact summary strip — deliberately plain, not another dashboard. */
export default function ChangesSummary({ changes }: ChangesSummaryProps) {
  const staleArtifacts = changes.reduce(
    (sum, c) => sum + c.impacted.filter((a) => a.state === "STALE").length,
    0,
  );
  const stats: Array<{ label: string; value: number }> = [
    { label: "Changes", value: changes.length },
    { label: "Needs Review", value: changes.filter((c) => c.status === "NEEDS REVIEW").length },
    {
      label: "Re-analysis Required",
      value: changes.filter((c) => c.status === "RE-ANALYSIS REQUIRED").length,
    },
    {
      label: "Confirmed Valid",
      value: changes.filter((c) => c.status === "CONFIRMED VALID").length,
    },
    { label: "Stale Artifacts", value: staleArtifacts },
  ];

  return (
    <dl
      aria-label="Changes summary"
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
