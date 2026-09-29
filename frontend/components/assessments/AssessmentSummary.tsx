import type { AssessmentRecord } from "@/lib/assessments-data";

interface AssessmentSummaryProps {
  assessments: AssessmentRecord[];
}

/** Compact summary strip — deliberately plain, not a second dashboard. */
export default function AssessmentSummary({ assessments }: AssessmentSummaryProps) {
  const stats: Array<{ label: string; value: number }> = [
    { label: "Total assessed", value: assessments.length },
    { label: "High risk", value: assessments.filter((a) => a.band === "HIGH").length },
    { label: "Medium risk", value: assessments.filter((a) => a.band === "MEDIUM").length },
    { label: "Low risk", value: assessments.filter((a) => a.band === "LOW").length },
    { label: "Needs review", value: assessments.filter((a) => a.status === "needs-review").length },
  ];

  return (
    <dl
      aria-label="Assessment summary"
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
