"use client";

import { X } from "lucide-react";
import type { ChangeStatus, ImpactKind } from "@/lib/changes-data";

export interface ChangeFilterState {
  statuses: ChangeStatus[];
  requirementIds: string[];
  impactKinds: ImpactKind[];
}

interface ChangesFiltersProps {
  filters: ChangeFilterState;
  onChange: (filters: ChangeFilterState) => void;
  onClear: () => void;
  requirementOptions: string[];
}

const STATUS_OPTIONS: ChangeStatus[] = [
  "NEEDS REVIEW",
  "RE-ANALYSIS REQUIRED",
  "CONFIRMED VALID",
  "ACCEPTED",
];
const IMPACT_OPTIONS: ImpactKind[] = ["Evidence", "Risk", "Assurance", "Test"];

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

export default function ChangesFilters({
  filters,
  onChange,
  onClear,
  requirementOptions,
}: ChangesFiltersProps) {
  const activeCount =
    filters.statuses.length + filters.requirementIds.length + filters.impactKinds.length;

  const chips: { label: string; onRemove: () => void }[] = [
    ...filters.statuses.map((s) => ({
      label: `Status: ${s}`,
      onRemove: () => onChange({ ...filters, statuses: toggle(filters.statuses, s) }),
    })),
    ...filters.requirementIds.map((id) => ({
      label: `Requirement: ${id}`,
      onRemove: () => onChange({ ...filters, requirementIds: toggle(filters.requirementIds, id) }),
    })),
    ...filters.impactKinds.map((k) => ({
      label: `Impact: ${k}`,
      onRemove: () => onChange({ ...filters, impactKinds: toggle(filters.impactKinds, k) }),
    })),
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Change status
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
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Requirement
          </legend>
          <div className="flex flex-wrap gap-2">
            {requirementOptions.map((option) => {
              const checked = filters.requirementIds.includes(option);
              return (
                <label key={option} className={pillClass(checked)}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        ...filters,
                        requirementIds: toggle(filters.requirementIds, option),
                      })
                    }
                  />
                  <span className="font-mono">{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Impact type
          </legend>
          <div className="flex flex-wrap gap-2">
            {IMPACT_OPTIONS.map((option) => {
              const checked = filters.impactKinds.includes(option);
              return (
                <label key={option} className={pillClass(checked)}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      onChange({ ...filters, impactKinds: toggle(filters.impactKinds, option) })
                    }
                  />
                  {option}
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
