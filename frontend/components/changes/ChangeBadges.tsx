import { AlertTriangle, BadgeCheck, Check, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChangeStatus } from "@/lib/changes-data";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap";

export function ChangeStatusBadge({ value }: { value: ChangeStatus }) {
  const Icon =
    value === "NEEDS REVIEW"
      ? AlertTriangle
      : value === "RE-ANALYSIS REQUIRED"
        ? RefreshCcw
        : value === "CONFIRMED VALID"
          ? BadgeCheck
          : Check;
  return (
    <span
      className={cn(
        base,
        value === "NEEDS REVIEW" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        value === "RE-ANALYSIS REQUIRED" &&
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
        value === "CONFIRMED VALID" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "ACCEPTED" &&
          "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}
