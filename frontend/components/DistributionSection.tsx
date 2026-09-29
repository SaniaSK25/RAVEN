export interface DistributionRow {
  key: string;
  label: string;
  value: number;
  /** Tailwind classes for the bar segment fill. */
  barClassName: string;
  /** Tailwind classes for the text badge. */
  badgeClassName: string;
}

interface DistributionSectionProps {
  title: string;
  description: string;
  rows: DistributionRow[];
}

export default function DistributionSection({
  title,
  description,
  rows,
}: DistributionSectionProps) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <section
      aria-label={title}
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>

      {/* Segmented bar: widths are proportional, labels live in the list below
          so color is never the only indicator. */}
      <div
        className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="img"
        aria-label={`${title}: ${rows
          .map((row) => `${row.label} ${row.value}`)
          .join(", ")}`}
      >
        {rows.map((row) => {
          const width = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <div
              key={row.key}
              className={row.barClassName}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </div>

      <dl className="mt-5 space-y-4">
        {rows.map((row) => {
          const percent =
            total > 0 ? Math.round((row.value / total) * 100) : 0;
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4"
            >
              <dt className="flex items-center gap-3">
                <span
                  className={`inline-flex min-w-24 justify-center rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${row.badgeClassName}`}
                >
                  {row.label}
                </span>
                <span className="text-sm text-zinc-600 tabular-nums dark:text-zinc-300">
                  {percent}% of total
                </span>
              </dt>
              <dd className="text-lg font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-5 border-t border-zinc-100 pt-4 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Total: <span className="font-semibold tabular-nums">{total}</span>{" "}
        requirements
      </p>
    </section>
  );
}
