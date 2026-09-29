"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { ChangeStatusBadge } from "@/components/changes/ChangeBadges";
import ChangeDetail from "@/components/changes/ChangeDetail";
import type { ChangeRecord, ChangeSortDir, ChangeSortKey } from "@/lib/changes-data";

interface ChangesTableProps {
  items: ChangeRecord[];
  sortKey: ChangeSortKey;
  sortDir: ChangeSortDir;
  onSortChange: (key: ChangeSortKey) => void;
}

function SortButton({
  label,
  column,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: ChangeSortKey;
  sortKey: ChangeSortKey;
  sortDir: ChangeSortDir;
  onSortChange: (key: ChangeSortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <button
      type="button"
      onClick={() => onSortChange(column)}
      aria-label={`Sort by ${label}${active ? ` (${sortDir === "asc" ? "ascending" : "descending"})` : ""}`}
      className="inline-flex items-center gap-1 font-semibold hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-100"
    >
      {label}
      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
      {active ? (
        <span aria-hidden="true" className="text-[11px] tabular-nums">
          {sortDir === "asc" ? "▲" : "▼"}
        </span>
      ) : null}
    </button>
  );
}

/** Compact impacted-artifact summary, e.g. "Evidence · Risk · Assurance · 2 Tests". */
function impactedSummary(item: ChangeRecord): string {
  const kinds: string[] = [];
  if (item.impacted.some((a) => a.kind === "Evidence")) kinds.push("Evidence");
  if (item.impacted.some((a) => a.kind === "Risk")) kinds.push("Risk");
  if (item.impacted.some((a) => a.kind === "Assurance")) kinds.push("Assurance");
  const tests = item.impacted.filter((a) => a.kind === "Test").length;
  if (tests === 1) kinds.push("1 Test");
  if (tests > 1) kinds.push(`${tests} Tests`);
  return kinds.join(" · ");
}

export default function ChangesTable({ items, sortKey, sortDir, onSortChange }: ChangesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Change events. Activate a column header to sort. Expand a change to
          review what changed, what was affected, and what to do.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="w-8 px-2 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th scope="col" aria-sort={sortKey === "requirementId" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Requirement" column="requirementId" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              From
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              To
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Changed
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Impacted Artifacts
            </th>
            <th scope="col" aria-sort={sortKey === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Date" column="date" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const open = item.status === "NEEDS REVIEW" || item.status === "RE-ANALYSIS REQUIRED";
            const expanded = expandedId === item.id;
            const rowId = `change-row-${item.id}`;
            const href = `/requirements/${item.requirementId}`;
            return (
              <Fragment key={item.id}>
                <tr
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    expanded ? "border-b-0" : "last:border-0"
                  } ${open ? "border-l-2 border-l-amber-400" : ""}`}
                >
                  <td className="px-2 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      aria-expanded={expanded}
                      aria-controls={`${rowId}-detail`}
                      aria-label={`${expanded ? "Collapse" : "Expand"} review for ${item.id}`}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top">
                    <Link
                      href={href}
                      aria-label={`Open ${item.requirementId}`}
                      className="block rounded font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
                    >
                      {item.title}
                    </Link>
                    <Link
                      href={href}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="mt-0.5 block font-mono text-[13px] text-zinc-500 dark:text-zinc-400"
                    >
                      {item.requirementId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-[13px] whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {item.fromVersion}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-[13px] font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                    {item.toVersion}
                  </td>
                  <td className="max-w-3xs px-4 py-3 align-top text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                    {item.changeSummary}
                  </td>
                  <td className="px-4 py-3 align-top text-[13px] whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {impactedSummary(item)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <ChangeStatusBadge value={item.status} />
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-[13px] text-zinc-600 tabular-nums dark:text-zinc-300">
                    {item.date}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td />
                    <td colSpan={7} id={`${rowId}-detail`} className="px-4 pt-0 pb-4">
                      <ChangeDetail change={item} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
