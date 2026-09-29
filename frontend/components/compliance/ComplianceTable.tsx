"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpDown, ChevronDown } from "lucide-react";
import { CoverageStatusBadge } from "@/components/compliance/ComplianceBadges";
import type { ComplianceRecord, ComplianceSortDir, ComplianceSortKey } from "@/lib/compliance-data";

interface ComplianceTableProps {
  items: ComplianceRecord[];
  sortKey: ComplianceSortKey;
  sortDir: ComplianceSortDir;
  onSortChange: (key: ComplianceSortKey) => void;
}

function SortButton({
  label,
  column,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: ComplianceSortKey;
  sortKey: ComplianceSortKey;
  sortDir: ComplianceSortDir;
  onSortChange: (key: ComplianceSortKey) => void;
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

export default function ComplianceTable({ items, sortKey, sortDir, onSortChange }: ComplianceTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Regulatory criteria. Activate a column header to sort. Expand a criterion
          to inspect supporting requirements, evidence, and gaps.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="w-8 px-2 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th scope="col" aria-sort={sortKey === "criterion" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Criterion" column="criterion" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              Regulation
            </th>
            <th scope="col" aria-sort={sortKey === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Supporting Requirements
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Gap
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const rowId = `criterion-row-${item.id}`;
            return (
              <Fragment key={item.id}>
                <tr
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    expanded ? "border-b-0" : "last:border-0"
                  } ${item.needsReview ? "border-l-2 border-l-amber-400" : ""}`}
                >
                  <td className="px-2 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      aria-expanded={expanded}
                      aria-controls={`${rowId}-detail`}
                      aria-label={`${expanded ? "Collapse" : "Expand"} detail for ${item.code}`}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                  <td className="max-w-sm px-4 py-3 align-top">
                    <span className="block font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
                      {item.code}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-[13px] whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {item.regulation}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CoverageStatusBadge value={item.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    {item.supporting.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {item.supporting.map((req) => (
                          <Link
                            key={req.requirementId}
                            href={`/requirements/${req.requirementId}`}
                            aria-label={`Open ${req.requirementId}`}
                            className="rounded border border-zinc-300 bg-white px-2 py-0.5 font-mono text-[12px] font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500"
                          >
                            {req.requirementId}
                          </Link>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[13px] text-zinc-400 dark:text-zinc-500">None</span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                    {item.gaps.length > 0 ? item.gaps[0] : "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {item.needsReview ? (
                      <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800 uppercase dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                        Needs review
                      </span>
                    ) : (
                      <span className="text-[13px] text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td />
                    <td colSpan={6} id={`${rowId}-detail`} className="px-4 pt-0 pb-4">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
                            {item.code}
                          </span>
                          <CoverageStatusBadge value={item.status} />
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                          {item.regulation}
                        </p>

                        <h3 className="mt-3 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
                          Supporting requirements & evidence
                        </h3>
                        {item.supporting.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {item.supporting.map((req) => (
                              <li
                                key={req.requirementId}
                                className="rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
                              >
                                <Link
                                  href={`/requirements/${req.requirementId}`}
                                  className="font-mono text-[13px] font-semibold text-zinc-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-100"
                                >
                                  {req.requirementId}
                                </Link>
                                <blockquote className="mt-1 text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                                  “{req.excerpt}”
                                </blockquote>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                            No supporting requirement recorded for this criterion.
                          </p>
                        )}

                        {item.gaps.length > 0 ? (
                          <div className="mt-3">
                            <h3 className="text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
                              Gap
                            </h3>
                            <ul className="mt-1.5 space-y-1.5">
                              {item.gaps.map((gap) => (
                                <li
                                  key={gap}
                                  className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                                >
                                  {gap}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {item.needsReview && item.reviewReason ? (
                          <p className="mt-2.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                              Needs review:{" "}
                            </span>
                            {item.reviewReason}
                          </p>
                        ) : null}
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
