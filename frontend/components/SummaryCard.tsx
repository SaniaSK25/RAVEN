interface SummaryCardProps {
  label: string;
  value: number;
  subtext?: string;
}

export default function SummaryCard({ label, value, subtext }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
        {value}
      </p>
      {subtext ? (
        <p className="mt-1 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
