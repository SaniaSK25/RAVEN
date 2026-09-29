import { AlertTriangle, CheckCircle2, Clock, MinusCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TraceCoverage } from "@/lib/traceability-data";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap";

export function CoverageBadge({ value }: { value: TraceCoverage }) {
  const Icon =
    value === "Covered"
      ? CheckCircle2
      : value === "Needs Review"
        ? AlertTriangle
        : value === "Stale"
          ? Clock
          : MinusCircle;
  return (
    <span
      className={cn(
        base,
        value === "Covered" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "Needs Review" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        value === "Stale" &&
          "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
        value === "Missing" &&
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}
