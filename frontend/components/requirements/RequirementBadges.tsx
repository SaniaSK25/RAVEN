import {
  AlertTriangle,
  Clock,
  FileCheck2,
  OctagonAlert,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  assuranceLabel,
  statusHint,
  statusLabel,
} from "@/lib/requirements-data";
import type {
  AssuranceOutcome,
  RequirementStatus,
  RiskBand,
} from "@/lib/domain";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap";

export function RiskBadge({ value }: { value: RiskBand }) {
  const Icon = value === "LOW" ? ShieldCheck : value === "MEDIUM" ? ShieldAlert : OctagonAlert;
  return (
    <span
      className={cn(
        base,
        value === "LOW" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "MEDIUM" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        value === "HIGH" &&
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}

export function AssuranceBadge({ value }: { value: AssuranceOutcome }) {
  return (
    <span
      title={assuranceLabel(value)}
      className={cn(
        base,
        value === "scripted" &&
          "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
        value === "exploratory" &&
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
        value === "unscripted-supplier" &&
          "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
        value === "unscripted-adhoc" &&
          "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
      )}
    >
      <FileCheck2 aria-hidden="true" className="h-3.5 w-3.5" />
      {assuranceLabel(value)}
    </span>
  );
}

export function StatusBadge({ value }: { value: RequirementStatus }) {
  const hint = statusHint(value);
  const Icon =
    value === "needs-review"
      ? AlertTriangle
      : value === "warning"
        ? AlertTriangle
        : value === "stale"
          ? Clock
          : value === "current"
            ? ShieldCheck
            : Clock;
  return (
    <span
      title={hint ?? statusLabel(value)}
      className={cn(
        base,
        value === "current" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "needs-review" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        value === "warning" &&
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
        value === "stale" &&
          "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
        (value !== "current" &&
          value !== "needs-review" &&
          value !== "warning" &&
          value !== "stale") &&
          "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {statusLabel(value)}
    </span>
  );
}
