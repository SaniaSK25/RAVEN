import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CoverageStatus } from "@/lib/compliance-data";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap";

export function CoverageStatusBadge({ value }: { value: CoverageStatus }) {
  const Icon =
    value === "covered" ? CheckCircle2 : value === "partial" ? AlertTriangle : MinusCircle;
  const label = value === "covered" ? "COVERED" : value === "partial" ? "PARTIAL" : "ABSENT";
  return (
    <span
      className={cn(
        base,
        value === "covered" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "partial" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        value === "absent" &&
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
