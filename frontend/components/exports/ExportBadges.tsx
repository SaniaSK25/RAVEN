import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ExportStatus } from "@/lib/exports-data";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap";

export function ExportStatusBadge({ value }: { value: ExportStatus }) {
  const Icon =
    value === "READY" ? CheckCircle2 : value === "BUILDING" ? Loader2 : AlertTriangle;
  return (
    <span
      className={cn(
        base,
        value === "READY" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "BUILDING" &&
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
        value === "FAILED" &&
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
      )}
    >
      <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${value === "BUILDING" ? "animate-spin" : ""}`} />
      {value}
    </span>
  );
}
