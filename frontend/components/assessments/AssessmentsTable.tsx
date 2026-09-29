"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { RiskBadge, StatusBadge } from "@/components/requirements/RequirementBadges";
import type {
  AssessmentRecord,
  AssessmentSortDir,
  AssessmentSortKey,
} from "@/lib/assessments-data";

interface AssessmentsTableProps {
  items: AssessmentRecord[];
  sortKey: AssessmentSortKey;
  sortDir: AssessmentSortDir;
  onSortChange: (key: AssessmentSortKey) => void;
}

function SortButton({
  label,
  column,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: AssessmentSortKey;
  sortKey: AssessmentSortKey;
  sortDir: AssessmentSortDir;
  onSortChange: (key: AssessmentSortKey) => void;
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

function detailHref(id: string): string {
  return `/requirements/${id}?tab=risk`;
}

export default function AssessmentsTable({
  items,
  sortKey,
  sortDir,
  onSortChange,
}: AssessmentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Risk assessments. Activate a column header to sort. Activate a row to
          open the requirement risk section.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Requirement" column="id" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "severity" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Severity" column="severity" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "probability" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Probability" column="probability" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "detectability" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Detectability" column="detectability" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "rpn" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="RPN" column="rpn" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Risk
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const outdated = item.assessedVersion !== item.currentVersion;
            const needsAttention = item.status === "needs-review" || item.status === "stale";
            return (
              <tr
                key={item.requirementId}
                className={`border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                  needsAttention ? "border-l-2 border-l-amber-400" : ""
                }`}
              >
                <td className="max-w-md px-4 py-3 align-top">
                  <Link
                    href={detailHref(item.requirementId)}
                    aria-label={`Open risk section for ${item.requirementId}`}
                    className="block rounded font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
                  >
                    {item.title}
                  </Link>
                  <Link
                    href={detailHref(item.requirementId)}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="mt-0.5 block font-mono text-[13px] text-zinc-500 dark:text-zinc-400"
                  >
                    {item.requirementId}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top text-zinc-900 tabular-nums dark:text-zinc-50">
                  {item.severity}
                </td>
                <td className="px-4 py-3 align-top text-zinc-900 tabular-nums dark:text-zinc-50">
                  {item.probability}
                </td>
                <td className="px-4 py-3 align-top text-zinc-900 tabular-nums dark:text-zinc-50">
                  {item.detectability}
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
                  <RiskBadge value={item.band} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge value={item.status} />
                  {outdated ? (
                    <span className="mt-1 block text-[12px] text-zinc-500 dark:text-zinc-400">
                      Assessed {item.assessedVersion} · current {item.currentVersion}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
