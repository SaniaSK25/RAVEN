"use client";

import { X } from "lucide-react";
import { assuranceLabel, statusLabel } from "@/lib/requirements-data";
import type {
  AssuranceOutcome,
  RequirementStatus,
  RiskBand,
} from "@/lib/domain";

export interface RequirementFilterState {
  risks: RiskBand[];
  assurances: AssuranceOutcome[];
  statuses: RequirementStatus[];
}

interface RequirementFiltersProps {
  filters: RequirementFilterState;
  onChange: (filters: RequirementFilterState) => void;
  onClear: () => void;
  /** Distinct values present in demo data, to keep filter options tight. */
  availableStatuses: RequirementStatus[];
}

const RISK_OPTIONS: RiskBand[] = ["LOW", "MEDIUM", "HIGH"];
const ASSURANCE_OPTIONS: AssuranceOutcome[] = [
  "scripted",
  "exploratory",
  "unscripted-supplier",
  "unscripted-adhoc",
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function RequirementFilters({
  filters,
  onChange,
  onClear,
  availableStatuses,
}: RequirementFiltersProps) {
  const activeCount =
    filters.risks.length + filters.assurances.length + filters.statuses.length;

  const chips: { label: string; onRemove: () => void }[] = [
    ...filters.risks.map((r) => ({
      label: `Risk: ${r}`,
      onRemove: () => onChange({ ...filters, risks: toggle(filters.risks, r) }),
    })),
    ...filters.assurances.map((a) => ({
      label: `Assurance: ${assuranceLabel(a)}`,
      onRemove: () =>
        onChange({ ...filters, assurances: toggle(filters.assurances, a) }),
    })),
    ...filters.statuses.map((s) => ({
      label: `Status: ${statusLabel(s)}`,
      onRemove: () =>
        onChange({ ...filters, statuses: toggle(filters.statuses, s) }),
    })),
  ];

  const groupClass = "flex flex-wrap gap-2";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Risk
          </legend>
          <div className={groupClass}>
            {RISK_OPTIONS.map((option) => {
              const checked = filters.risks.includes(option);
              return (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold tracking-wide ${
                    checked
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      onChange({ ...filters, risks: toggle(filters.risks, option) })
                    }
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Assurance
          </legend>
          <div className={groupClass}>
            {ASSURANCE_OPTIONS.map((option) => {
              const checked = filters.assurances.includes(option);
              return (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold tracking-wide ${
                    checked
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        ...filters,
                        assurances: toggle(filters.assurances, option),
                      })
                    }
                  />
                  {assuranceLabel(option)}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </legend>
          <div className={groupClass}>
            {availableStatuses.map((option) => {
              const checked = filters.statuses.includes(option);
              return (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold tracking-wide ${
                    checked
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        ...filters,
                        statuses: toggle(filters.statuses, option),
                      })
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
