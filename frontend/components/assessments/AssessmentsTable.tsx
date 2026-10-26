"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { RiskBadge } from "@/components/requirements/RequirementBadges";
import type {
  AssessmentDecisionStep,
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

const FACTOR_LABELS: Record<string, string> = {
  patient_safety: "Patient safety",
  product_quality: "Product quality",
  batch_release: "Batch release",
  data_integrity: "Data integrity",
  regulatory_compliance: "Regulatory compliance",
  business_continuity: "Business continuity",
  functional_complexity: "Functional complexity",
  dependency_complexity: "Dependency complexity",
  workflow_complexity: "Workflow complexity",
  detection_controls: "Detection controls",
  traceability: "Traceability",
  failure_visibility: "Failure visibility",
};

function evidenceItems(path: AssessmentDecisionStep[]) {
  return path.flatMap((step) => {
    if (
      typeof step.check !== "string" ||
      step.check === "computation" ||
      typeof step.evidence !== "string" ||
      step.evidence.trim() === ""
    ) {
      return [];
    }
    return [{
      label: FACTOR_LABELS[step.check] ?? step.check.replaceAll("_", " "),
      evidence: step.evidence,
    }];
  });
}

export default function AssessmentsTable({
  items,
  sortKey,
  sortDir,
  onSortChange,
}: AssessmentsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Risk assessments. Activate a column header to sort. Activate a row to
          open the requirement risk section, or expand a row to read saved evidence.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="px-2 py-4 font-semibold">
              Evidence
            </th>
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
            const expanded = expandedId === item.assessmentId;
            const detailId = `assessment-reasoning-${item.assessmentId}`;
            const scoreDetails = [
              {
                label: "Severity",
                path: item.severityDecisionPath,
              },
              {
                label: "Probability",
                path: item.probabilityDecisionPath,
              },
              {
                label: "Detectability",
                path: item.detectabilityDecisionPath,
              },
            ] as const;
            return (
              <Fragment key={item.assessmentId}>
                <tr
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    isStale ? "border-l-2 border-l-amber-400" : ""
                  } ${expanded ? "border-b-0" : "last:border-0"}`}
                >
                  <td className="px-2 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.assessmentId)}
                      aria-expanded={expanded}
                      aria-controls={detailId}
                      aria-label={`${expanded ? "Hide" : "Show"} assessment evidence for ${item.requirementId}`}
                      className="inline-flex items-center gap-1 rounded px-1 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                      {expanded ? "Hide" : "View"}
                    </button>
                  </td>
                <td className="max-w-md px-5 py-4 align-top">
                  <Link
                    href={detailHref(item.requirementId)}
                    aria-label={`Open risk section for ${item.requirementId}`}
                    className="block rounded text-[15px] font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-50"
                  >
                    {item.title}
                  </Link>
                  <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    Assessed against {item.assessedVersion}
                    {isStale ? ` · current ${item.currentVersion}` : ""}
                  </span>
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
                {expanded ? (
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td colSpan={8} id={detailId} className="px-4 pt-0 pb-4">
                      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Evidence
                        </h2>
                        <div className="mt-3 grid gap-5 md:grid-cols-3">
                          {scoreDetails.map(({ label, path }) => {
                            const items = evidenceItems(path);
                            return (
                              <section key={label} className="min-w-0">
                                <h3 className="border-b border-zinc-200 pb-2 text-[13px] font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                                  {label}
                                </h3>
                                {items.length > 0 ? (
                                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {items.map(({ label: factor, evidence }) => (
                                      <li key={factor} className="py-3 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                                        <span className="font-medium text-zinc-800 dark:text-zinc-100">
                                          {factor}:{" "}
                                        </span>
                                        {evidence}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                                    No evidence is available.
                                  </p>
                                )}
                              </section>
                            );
                          })}
                        </div>
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
