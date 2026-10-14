"use client";

import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { RiskBadge } from "@/components/requirements/RequirementBadges";
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
          <tr className="border-b border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-5 py-4 font-semibold">
              <SortButton label="Requirement" column="id" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "severity" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-5 py-4 font-semibold whitespace-nowrap">
              <SortButton label="Severity" column="severity" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "probability" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-5 py-4 font-semibold whitespace-nowrap">
              <SortButton label="Probability" column="probability" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "detectability" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-5 py-4 font-semibold whitespace-nowrap">
              <SortButton label="Detectability" column="detectability" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "rpn" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-5 py-4 font-semibold whitespace-nowrap">
              <SortButton label="RPN score" column="rpn" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Risk level
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Freshness
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isStale = item.status === "stale";
            return (
              <tr
                key={item.assessmentId}
                className={`border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                  isStale ? "border-l-2 border-l-amber-400" : ""
                }`}
              >
                <td className="max-w-md px-5 py-4 align-top">
                  <Link
                    href={detailHref(item.requirementId)}
                    aria-label={`Open risk section for ${item.requirementId}`}
                    className="block rounded text-[15px] font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
                  >
                    {item.title}
                  </Link>
                  <Link
                    href={detailHref(item.requirementId)}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="mt-0.5 block font-mono text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {item.requirementId}
                  </Link>
                </td>
                <td className="px-5 py-4 align-top text-sm text-zinc-900 tabular-nums dark:text-zinc-50">
                  {item.severity ?? "—"}
                </td>
                <td className="px-5 py-4 align-top text-sm text-zinc-900 tabular-nums dark:text-zinc-50">
                  {item.probability ?? "—"}
                </td>
                <td className="px-5 py-4 align-top text-sm text-zinc-900 tabular-nums dark:text-zinc-50">
                  {item.detectability ?? "—"}
                </td>
                <td
                  className={`px-5 py-4 align-top text-sm tabular-nums ${
                    item.band === "HIGH"
                      ? "font-bold text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {item.rpn ?? "—"}
                </td>
                <td className="px-5 py-4 align-top">
                  {item.band ? <RiskBadge value={item.band} /> : "—"}
                </td>
                <td className="px-5 py-4 align-top">
                  <span
                    title={
                      isStale
                        ? "This assessment is outdated — the requirement changed since it was assessed."
                        : "This assessment matches the current requirement version."
                    }
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      isStale
                        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                    }`}
                  >
                    {isStale ? "Stale" : "Fresh"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
