"use client";

import { Search, X } from "lucide-react";

interface RequirementSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RequirementSearch({ value, onChange }: RequirementSearchProps) {
  return (
    <div role="search" className="w-full sm:max-w-sm">
      <label
        htmlFor="requirements-search"
        className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
      >
        Search requirements
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        />
        <input
          id="requirements-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by ID or text…"
          autoComplete="off"
          className="w-full rounded-md border border-zinc-300 bg-white py-2 pr-9 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:outline-zinc-100"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
