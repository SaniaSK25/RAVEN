interface SummaryCardProps {
  label: string;
  value: number;
  subtext?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "slate" | "sky";
}

const toneClasses = {
  brand: {
    container: "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-white",
    badge: "bg-orange-100 text-orange-700",
  },
  success: {
    container: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white",
    badge: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    container: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white",
    badge: "bg-amber-100 text-amber-700",
  },
  danger: {
    container: "border-red-200/80 bg-gradient-to-br from-red-50 via-white to-white",
    badge: "bg-red-100 text-red-700",
  },
  slate: {
    container: "border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-white",
    badge: "bg-zinc-200 text-zinc-700",
  },
  sky: {
    container: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white",
    badge: "bg-sky-100 text-sky-700",
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
      className={`group rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950 ${classes.container}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${classes.badge}`}
          aria-hidden="true"
        >
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Live
        </span>
      </div>

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
