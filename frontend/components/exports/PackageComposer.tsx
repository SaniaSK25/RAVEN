"use client";

import { PackagePlus } from "lucide-react";
import { PACKAGE_CONTENTS, type PackageContentKey } from "@/lib/exports-data";

interface PackageComposerProps {
  selected: PackageContentKey[];
  onChange: (selected: PackageContentKey[]) => void;
  onCreate: () => void;
  creating: boolean;
}

function toggle(list: PackageContentKey[], value: PackageContentKey): PackageContentKey[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Sensible defaults: everything selected; the user trims what they need. */
export const DEFAULT_CONTENTS: PackageContentKey[] = PACKAGE_CONTENTS.map((c) => c.key);

export default function PackageComposer({ selected, onChange, onCreate, creating }: PackageComposerProps) {
  return (
    <section
      aria-label="Create audit package"
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Create Audit Package
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Bundle the current RAVEN analysis and supporting evidence into one audit
        package. Everything is selected by default — trim what you don&apos;t need.
      </p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
          Package contents
        </legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PACKAGE_CONTENTS.map((option) => {
            const checked = selected.includes(option.key);
            return (
              <li key={option.key}>
                <label
                  className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3.5 py-2.5 ${
                    checked
                      ? "border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-900"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange(toggle(selected, option.key))}
                    className="mt-1 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {option.label}
                    </span>
                    <span className="block text-[13px] text-zinc-500 dark:text-zinc-400">
                      {option.description}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={creating || selected.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-brand hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent dark:text-brand dark:hover:bg-accent-dark"
        >
          <PackagePlus aria-hidden="true" className="h-4 w-4" />
          {creating ? "Building package…" : "Create Audit Package"}
        </button>
        {selected.length === 0 ? (
          <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
            Select at least one content section to create a package.
          </span>
        ) : (
          <span className="text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400">
            {selected.length} of {PACKAGE_CONTENTS.length} sections selected · outputs DOCX, PDF, ZIP (demo)
          </span>
        )}
      </div>
    </section>
  );
}
