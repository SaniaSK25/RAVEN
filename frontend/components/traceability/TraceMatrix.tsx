"use client";

import Link from "next/link";
import { Check, GitBranch, Minus } from "lucide-react";
import { AssuranceBadge } from "@/components/requirements/RequirementBadges";
import { CoverageBadge } from "@/components/traceability/TraceBadges";
import { assuranceLabel } from "@/lib/requirements-data";
import type { TraceMatrixRow } from "@/lib/traceability-data";

interface TraceMatrixProps {
  items: TraceMatrixRow[];
  onViewChain: (requirementId: string) => void;
}

function LinkedCell({ row }: { row: TraceMatrixRow }) {
  if (!row.inList) {
    return (
      <span>
        <span className="block font-medium text-zinc-900 dark:text-zinc-50">{row.title}</span>
        <span className="mt-0.5 block font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
          {row.requirementId}
        </span>
        <span className="mt-1 block text-[12px] text-zinc-500 dark:text-zinc-400">
          Trace-only record — not in the requirements list
        </span>
      </span>
    );
  }
  const href = `/requirements/${row.requirementId}`;
  return (
    <span>
      <Link
        href={href}
        aria-label={`Open ${row.requirementId}`}
        className="block rounded font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
      >
        {row.title}
      </Link>
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="mt-0.5 block font-mono text-[13px] text-zinc-500 dark:text-zinc-400"
      >
        {row.requirementId}
      </Link>
    </span>
  );
}

export default function TraceMatrix({ items, onViewChain }: TraceMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Traceability matrix. Each row shows the recorded links for one requirement.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="px-4 py-3 font-medium">
              Requirement
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              Risk
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Assurance
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Test / Coverage
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              <span className="sr-only">Chain</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const attention = row.coverage === "Needs Review" || row.coverage === "Stale" || row.coverage === "Missing";
            return (
              <tr
                key={row.requirementId}
                className={`border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                  attention ? "border-l-2 border-l-amber-400" : ""
                }`}
              >
                <td className="max-w-md px-4 py-3 align-top">
                  <LinkedCell row={row} />
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {row.hasRisk && row.band ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-700 dark:text-zinc-200">
                      <Check aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {row.band} · <span className="tabular-nums">RPN {row.rpn}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                      <Minus aria-hidden="true" className="h-4 w-4" />
                      Missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {row.hasAssurance && row.assurance ? (
                    <AssuranceBadge value={row.assurance} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                      <Minus aria-hidden="true" className="h-4 w-4" />
                      Missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-[13px]">
                  {row.testCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
                      <Check aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {row.testCount} test{row.testCount === 1 ? "" : "s"}
                    </span>
                  ) : row.hasAssurance && row.assurance ? (
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {assuranceLabel(row.assurance)} · Covered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Minus aria-hidden="true" className="h-4 w-4" />
                      No coverage
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <CoverageBadge value={row.coverage} />
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    onClick={() => onViewChain(row.requirementId)}
                    aria-label={`View chain for ${row.requirementId}`}
                    title={`View chain for ${row.requirementId}`}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <GitBranch aria-hidden="true" className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
