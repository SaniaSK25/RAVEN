import type { AssuranceRecord } from "@/lib/assurance-data";

interface AssuranceSummaryProps {
  decisions: AssuranceRecord[];
}

/** Compact summary strip — deliberately plain, not another dashboard. */
export default function AssuranceSummary({ decisions }: AssuranceSummaryProps) {
  const stats: Array<{ label: string; value: number }> = [
    { label: "Total decisions", value: decisions.length },
    { label: "Scripted", value: decisions.filter((d) => d.outcome === "scripted").length },
    { label: "Exploratory", value: decisions.filter((d) => d.outcome === "exploratory").length },
    {
      label: "Supplier Assurance",
      value: decisions.filter((d) => d.outcome === "unscripted-supplier").length,
    },
    {
      label: "Unscripted",
      value: decisions.filter((d) => d.outcome === "unscripted-adhoc").length,
    },
  ];

  return (
    <dl
      aria-label="Assurance summary"
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
