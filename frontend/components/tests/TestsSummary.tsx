import type { TestRecord } from "@/lib/tests-data";

interface TestsSummaryProps {
  tests: TestRecord[];
}

/** Compact summary strip — deliberately plain, not another dashboard. */
export default function TestsSummary({ tests }: TestsSummaryProps) {
  const stats: Array<{ label: string; value: number }> = [
    { label: "Total Tests", value: tests.length },
    { label: "Generated", value: tests.filter((t) => t.type === "GENERATED").length },
    { label: "Manual", value: tests.filter((t) => t.type === "MANUAL").length },
    { label: "Needs Review", value: tests.filter((t) => t.status === "NEEDS REVIEW").length },
    { label: "Stale", value: tests.filter((t) => t.status === "STALE").length },
  ];

  return (
    <dl
      aria-label="Tests summary"
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
