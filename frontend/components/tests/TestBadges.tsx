import { AlertTriangle, Bot, Clock, Hand, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TestDisplayStatus, TestType } from "@/lib/tests-data";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap";

export function TestTypeBadge({ value }: { value: TestType }) {
  const Icon = value === "GENERATED" ? Bot : Hand;
  return (
    <span
      className={cn(
        base,
        value === "GENERATED" &&
          "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
        value === "MANUAL" &&
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}

export function TestStatusBadge({ value }: { value: TestDisplayStatus }) {
  const Icon =
    value === "NEEDS REVIEW"
      ? AlertTriangle
      : value === "STALE"
        ? Clock
        : value === "APPROVED"
          ? ShieldCheck
          : Clock;
  return (
    <span
      className={cn(
        base,
        value === "APPROVED" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        value === "NEEDS REVIEW" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        value === "STALE" &&
          "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
        value === "READY" &&
          "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}
