"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import type { SortDir, SortKey } from "@/lib/requirements-data";
import type { RequirementListItem } from "@/lib/requirements-data";
import {
  AssuranceBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/requirements/RequirementBadges";

interface RequirementsTableProps {
  items: RequirementListItem[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
}

function SortButton({
  label,
  column,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
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

export default function RequirementsTable({
  items,
  sortKey,
  sortDir,
  onSortChange,
}: RequirementsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Requirements list. Activate a column header to sort. Activate a row to
          open the requirement.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="ID" column="id" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Requirement
            </th>
            <th scope="col" aria-sort={sortKey === "version" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Version" column="version" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Risk
            </th>
            <th scope="col" aria-sort={sortKey === "rpn" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="RPN" column="rpn" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Assurance
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const needsAttention =
              item.status === "needs-review" ||
              item.status === "warning" ||
              item.status === "stale" ||
              item.risk === "HIGH";
            return (
              <tr
                key={item.id}
                className={`border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                  needsAttention ? "border-l-2 border-l-amber-400" : ""
                }`}
              >
                <td className="px-4 py-3 align-top font-mono text-[13px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                  <Link
                    href={`/requirements/${item.id}`}
                    aria-label={`Open ${item.id}`}
                    className="rounded underline-offset-4 hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-100"
                  >
                    {item.id}
                  </Link>
                </td>
                <td className="max-w-md px-4 py-3 align-top">
                  <Link
                    href={`/requirements/${item.id}`}
                    className="block rounded font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap text-zinc-600 tabular-nums dark:text-zinc-300">
                  {item.version}
                </td>
                <td className="px-4 py-3 align-top">
                  <RiskBadge value={item.risk} />
                </td>
                <td
                  className={`px-4 py-3 align-top tabular-nums ${
                    item.rpn >= 51
                      ? "font-bold text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {item.rpn}
                </td>
                <td className="px-4 py-3 align-top">
                  <AssuranceBadge value={item.assurance} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge value={item.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
