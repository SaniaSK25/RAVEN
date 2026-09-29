"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpDown, BadgeCheck, ChevronDown } from "lucide-react";
import { AssuranceBadge } from "@/components/requirements/RequirementBadges";
import { TestStatusBadge, TestTypeBadge } from "@/components/tests/TestBadges";
import type { TestRecord, TestSortDir, TestSortKey } from "@/lib/tests-data";

interface TestsTableProps {
  items: TestRecord[];
  sortKey: TestSortKey;
  sortDir: TestSortDir;
  onSortChange: (key: TestSortKey) => void;
}

function SortButton({
  label,
  column,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: TestSortKey;
  sortKey: TestSortKey;
  sortDir: TestSortDir;
  onSortChange: (key: TestSortKey) => void;
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
  return `/requirements/${id}?tab=tests`;
}

export default function TestsTable({ items, sortKey, sortDir, onSortChange }: TestsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Formal scripted tests. Activate a column header to sort. Expand a test
          to inspect purpose, steps, and expected results.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="w-8 px-2 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th scope="col" aria-sort={sortKey === "testId" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Test" column="testId" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "requirementId" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Requirement" column="requirementId" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              Type
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Assurance
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Purpose
            </th>
            <th scope="col" aria-sort={sortKey === "steps" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium whitespace-nowrap">
              <SortButton label="Steps" column="steps" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
            <th scope="col" aria-sort={sortKey === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-medium">
              <SortButton label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} />
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const outdated = item.testedVersion !== item.currentVersion;
            const needsAttention = item.status === "NEEDS REVIEW" || item.status === "STALE";
            const expanded = expandedId === item.testId;
            const rowId = `test-row-${item.testId}`;
            return (
              <Fragment key={item.testId}>
                <tr
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    expanded ? "border-b-0" : "last:border-0"
                  } ${needsAttention ? "border-l-2 border-l-amber-400" : ""}`}
                >
                  <td className="px-2 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.testId)}
                      aria-expanded={expanded}
                      aria-controls={`${rowId}-detail`}
                      aria-label={`${expanded ? "Collapse" : "Expand"} inspection for ${item.testId}`}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-[13px] font-semibold whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                    {item.testId}
                    {item.warning ? (
                      <span className="mt-1 flex items-center gap-1 text-[12px] font-sans font-semibold text-amber-700 dark:text-amber-300">
                        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                        Warning
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-2xs px-4 py-3 align-top">
                    <Link
                      href={detailHref(item.requirementId)}
                      aria-label={`Open tests section for ${item.requirementId}`}
                      className="block rounded font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
                    >
                      {item.requirementTitle}
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
                    <TestTypeBadge value={item.type} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AssuranceBadge value={item.assurance} />
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                    {item.purpose}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-900 tabular-nums dark:text-zinc-50">
                    {item.steps.length}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <TestStatusBadge value={item.status} />
                    {outdated ? (
                      <span className="mt-1 block text-[12px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        Tested {item.testedVersion} · current {item.currentVersion}
                      </span>
                    ) : null}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td />
                    <td colSpan={7} id={`${rowId}-detail`} className="px-4 pt-0 pb-4">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <TestTypeBadge value={item.type} />
                          <TestStatusBadge value={item.status} />
                          {item.type === "GENERATED" ? (
                            <span className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-semibold tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                              <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                              Verified excerpt
                            </span>
                          ) : null}
                        </div>

                        {item.warning ? (
                          <p
                            role="status"
                            className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                          >
                            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                            {item.warning}
                          </p>
                        ) : null}

                        <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {item.purpose}
                        </p>
                        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                          Preconditions: {item.preconditions}
                        </p>

                        <ol className="mt-2.5 space-y-1.5 border-t border-zinc-200 pt-2.5 text-[13px] dark:border-zinc-700">
                          {item.steps.map((step) => (
                            <li key={step.stepNumber} className="flex gap-2.5">
                              <span aria-hidden="true" className="font-semibold text-zinc-400 tabular-nums dark:text-zinc-500">
                                {step.stepNumber}.
                              </span>
                              <span className="text-zinc-600 dark:text-zinc-300">
                                {step.action}
                                <span aria-hidden="true"> → </span>
                                <span className="text-zinc-500 dark:text-zinc-400">{step.expectedResult}</span>
                              </span>
                            </li>
                          ))}
                        </ol>

                        <p className="mt-2.5 text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            Acceptance criteria:{" "}
                          </span>
                          {item.acceptanceCriteria}
                        </p>

                        <figure className="mt-2.5 rounded border border-zinc-200 bg-white px-3.5 py-2.5 dark:border-zinc-700 dark:bg-zinc-950">
                          <figcaption className="text-[12px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                            Verifies — {item.requirementId}
                          </figcaption>
                          <blockquote className="mt-1 text-[13px] leading-5 text-zinc-700 dark:text-zinc-200">
                            “{item.verifiesExcerpt}”
                          </blockquote>
                        </figure>

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
