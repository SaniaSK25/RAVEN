"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import {
  AssuranceBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/requirements/RequirementBadges";
import {
  nonScriptedNote,
  type AssuranceRecord,
  type AssuranceSortDir,
  type AssuranceSortKey,
} from "@/lib/assurance-data";
import { assuranceLabel } from "@/lib/requirements-data";

interface AssuranceTableProps {
  items: AssuranceRecord[];
  sortKey: AssuranceSortKey;
  sortDir: AssuranceSortDir;
  onSortChange: (key: AssuranceSortKey) => void;
}

function SortButton({
  label,
  column,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: AssuranceSortKey;
  sortKey: AssuranceSortKey;
  sortDir: AssuranceSortDir;
  onSortChange: (key: AssuranceSortKey) => void;
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
  return `/requirements/${id}?tab=assurance`;
}

export default function AssuranceTable({ items, sortKey, sortDir, onSortChange }: AssuranceTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Assurance decisions. Activate a column header to sort. Expand a row to
          inspect the full reasoning, or activate a requirement to open its detail view.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="w-8 px-2 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th scope="col" aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Requirement" column="id" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Risk
            </th>
            <th scope="col" aria-sort={sortKey === "rpn" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="RPN" column="rpn" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              GxP
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              GAMP
            </th>
            <th scope="col" aria-sort={sortKey === "assurance" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Assurance" column="assurance" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Reason
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
            const expanded = expandedId === item.requirementId;
            const note = nonScriptedNote(item.outcome);
            const rowId = `assurance-row-${item.requirementId}`;
            return (
              <Fragment key={item.requirementId}>
                <tr
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    expanded ? "border-b-0" : "last:border-0"
                  } ${needsAttention ? "border-l-2 border-l-amber-400" : ""}`}
                >
                  <td className="px-2 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.requirementId)}
                      aria-expanded={expanded}
                      aria-controls={`${rowId}-detail`}
                      aria-label={`${expanded ? "Collapse" : "Expand"} reasoning for ${item.requirementId}`}
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
                      href={detailHref(item.requirementId)}
                      aria-label={`Open assurance section for ${item.requirementId}`}
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
                  <td className="px-4 py-3 align-top">
                    <RiskBadge value={item.band} />
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
                  <td className="px-4 py-3 align-top whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {item.gxpImpact ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {item.gampCategory}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AssuranceBadge value={item.outcome} />
                  </td>
                  <td className="max-w-3xs px-4 py-3 align-top text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                    {item.reason}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge value={item.status} />
                    {outdated ? (
                      <span className="mt-1 block text-[12px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        Decided {item.assessedVersion} · current {item.currentVersion}
                      </span>
                    ) : null}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td />
                    <td colSpan={8} id={`${rowId}-detail`} className="px-4 pt-0 pb-4">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <AssuranceBadge value={item.outcome} />
                          <span className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                            {item.ruleId}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                          {item.rationale}
                        </p>
                        {note ? (
                          <p className="mt-2 text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {assuranceLabel(item.outcome)} is a valid outcome.{" "}
                            </span>
                            {note}
                          </p>
                        ) : null}
                        {item.decisionPath.length > 0 ? (
                          <ol className="mt-2.5 space-y-1 border-t border-zinc-200 pt-2.5 font-mono text-[13px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                            {item.decisionPath.map((step, i) => (
                              <li key={`${i}-${step}`} className="flex gap-2.5">
                                <span aria-hidden="true" className="text-zinc-400 tabular-nums dark:text-zinc-500">
                                  {i + 1}.
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                        <Link
                          href={detailHref(item.requirementId)}
                          className="mt-2.5 inline-block text-[13px] font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-300"
                        >
                          Open Requirement Detail →
                        </Link>
                      </div>
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
