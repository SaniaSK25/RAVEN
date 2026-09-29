import type { ComplianceRecord } from "@/lib/compliance-data";

interface ComplianceSummaryProps {
  criteria: ComplianceRecord[];
}

/** Compact summary strip — counts only, never a percentage. */
export default function ComplianceSummary({ criteria }: ComplianceSummaryProps) {
  const stats: Array<{ label: string; value: number }> = [
    { label: "Total Criteria", value: criteria.length },
    { label: "Covered", value: criteria.filter((c) => c.status === "covered").length },
    { label: "Partial", value: criteria.filter((c) => c.status === "partial").length },
    { label: "Absent", value: criteria.filter((c) => c.status === "absent").length },
  ];

  return (
    <dl
      aria-label="Compliance summary"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-800"
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
