interface SummaryCardProps {
  label: string;
  value: number;
  subtext?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "slate" | "sky";
}

const toneClasses = {
  brand: {
    container: "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-white",
  },
  success: {
    container: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white",
  },
  warning: {
    container: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white",
  },
  danger: {
    container: "border-red-200/80 bg-gradient-to-br from-red-50 via-white to-white",
  },
  slate: {
    container: "border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-white",
  },
  sky: {
    container: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white",
  },
} as const;

export default function SummaryCard({
  label,
  value,
  subtext,
  tone = "brand",
}: SummaryCardProps) {
  const classes = toneClasses[tone];

  return (
    <div
      tabIndex={0}
      className={`group rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] focus-visible:outline-2 focus-visible:outline-accent dark:border-zinc-800 dark:bg-zinc-950 ${classes.container}`}
    >
      <div className="mb-3 flex items-center justify-start gap-3">
        <p className="text-[15px] font-semibold leading-6 text-zinc-700 dark:text-zinc-200">
          {label}
        </p>
      </div>

      <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
        {value}
      </p>
      {subtext ? (
        <p className="mt-2 min-h-10 translate-y-1 text-sm leading-5 text-zinc-600 opacity-0 transition-all duration-200 select-none group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-active:opacity-100 dark:text-zinc-400">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
