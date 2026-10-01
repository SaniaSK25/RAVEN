"use client";

import { X } from "lucide-react";
import { statusLabel } from "@/lib/requirements-data";
import type { RequirementStatus, RiskBand } from "@/lib/domain";

export interface AssessmentFilterState {
  risks: RiskBand[];
  statuses: RequirementStatus[];
}

interface AssessmentFiltersProps {
  filters: AssessmentFilterState;
  onChange: (filters: AssessmentFilterState) => void;
  onClear: () => void;
}

const RISK_OPTIONS: RiskBand[] = ["LOW", "MEDIUM", "HIGH"];
const STATUS_OPTIONS: RequirementStatus[] = ["current", "needs-review", "stale"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function pillClass(checked: boolean): string {
  return `inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold tracking-wide ${
    checked
      ? "border-accent bg-accent text-brand dark:border-accent dark:bg-accent dark:text-brand"
      : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
  }`;
}

export default function AssessmentFilters({ filters, onChange, onClear }: AssessmentFiltersProps) {
  const activeCount = filters.risks.length + filters.statuses.length;

  const chips: { label: string; onRemove: () => void }[] = [
    ...filters.risks.map((r) => ({
      label: `Risk: ${r}`,
      onRemove: () => onChange({ ...filters, risks: toggle(filters.risks, r) }),
    })),
    ...filters.statuses.map((s) => ({
      label: `Status: ${statusLabel(s)}`,
      onRemove: () => onChange({ ...filters, statuses: toggle(filters.statuses, s) }),
    })),
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Risk
          </legend>
          <div className="flex flex-wrap gap-2">
            {RISK_OPTIONS.map((option) => {
              const checked = filters.risks.includes(option);
              return (
                <label key={option} className={pillClass(checked)}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onChange({ ...filters, risks: toggle(filters.risks, option) })}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </legend>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const checked = filters.statuses.includes(option);
              return (
                <label key={option} className={pillClass(checked)}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      onChange({ ...filters, statuses: toggle(filters.statuses, option) })
                    }
                  />
                  {statusLabel(option)}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {activeCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
            {activeCount} active filter{activeCount === 1 ? "" : "s"}:
          </span>
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter ${chip.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {chip.label}
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-[13px] font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
