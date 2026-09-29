"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronDown, Download, RotateCcw } from "lucide-react";
import { ExportStatusBadge } from "@/components/exports/ExportBadges";
import {
  BUILD_STEPS,
  PACKAGE_CONTENTS,
  type ExportFormat,
  type ExportPackage,
} from "@/lib/exports-data";

interface ExportHistoryProps {
  packages: ExportPackage[];
  buildingId: string | null;
  buildStep: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onRetry: (id: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function contentsSummary(pkg: ExportPackage): string {
  if (pkg.contents.length === PACKAGE_CONTENTS.length) return "Full package";
  const labels = pkg.contents.map(
    (key) => PACKAGE_CONTENTS.find((c) => c.key === key)?.label ?? key,
  );
  return labels.slice(0, 3).join(" · ") + (labels.length > 3 ? ` (+${labels.length - 3})` : "");
}

function DownloadButtons({ formats, disabledReason }: { formats: ExportFormat[]; disabledReason: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {formats.map((format) => (
        <button
          key={format}
          type="button"
          disabled
          title={disabledReason}
          aria-label={`Download ${format} (unavailable in demo)`}
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[13px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
        >
          <Download aria-hidden="true" className="h-3.5 w-3.5" />
          {format}
        </button>
      ))}
    </div>
  );
}

export default function ExportHistory({
  packages,
  buildingId,
  buildStep,
  expandedId,
  onToggle,
  onRetry,
}: ExportHistoryProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <caption className="sr-only">
          Export package history. Expand a package to inspect contents and downloads.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="w-8 px-2 py-3">
              <span className="sr-only">Details</span>
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Package
            </th>
            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
              Created
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Contents
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const expanded = expandedId === pkg.id;
            const building = buildingId === pkg.id;
            const rowId = `package-row-${pkg.id}`;
            return (
              <Fragment key={pkg.id}>
                <tr
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    expanded ? "border-b-0" : "last:border-0"
                  } ${pkg.status === "FAILED" ? "border-l-2 border-l-red-400" : ""}`}
                >
                  <td className="px-2 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onToggle(pkg.id)}
                      aria-expanded={expanded}
                      aria-controls={`${rowId}-detail`}
                      aria-label={`${expanded ? "Collapse" : "Expand"} package ${pkg.id}`}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top">
                    <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                      {pkg.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                      {pkg.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-[13px] whitespace-nowrap text-zinc-600 tabular-nums dark:text-zinc-300">
                    {formatDate(pkg.createdAt)}
                  </td>
                  <td className="max-w-3xs px-4 py-3 align-top text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
                    {contentsSummary(pkg)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <ExportStatusBadge value={pkg.status} />
                    {building ? (
                      <span className="mt-1 block text-[12px] text-zinc-500 dark:text-zinc-400">
                        {BUILD_STEPS[Math.min(buildStep, BUILD_STEPS.length - 1)]}…
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {pkg.status === "FAILED" && !building ? (
                      <button
                        type="button"
                        onClick={() => onRetry(pkg.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    ) : building ? (
                      <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Building…</span>
                    ) : (
                      <span className="text-[13px] text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td />
                    <td colSpan={5} id={`${rowId}-detail`} className="px-4 pt-0 pb-4">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
                            {pkg.id}
                          </span>
                          <ExportStatusBadge value={pkg.status} />
                          <span className="ml-auto text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400">
                            {formatDate(pkg.createdAt)}
                          </span>
                        </div>

                        {building ? (
                          <ol aria-label="Build progress" className="mt-3 space-y-1.5">
                            {BUILD_STEPS.map((step, i) => {
                              const done = i < buildStep;
                              const current = i === buildStep && buildStep < BUILD_STEPS.length - 1;
                              return (
                                <li
                                  key={step}
                                  aria-current={current ? "step" : undefined}
                                  className={`flex items-center gap-2.5 text-[13px] ${
                                    done
                                      ? "text-zinc-900 dark:text-zinc-100"
                                      : current
                                        ? "font-semibold text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-400 dark:text-zinc-500"
                                  }`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] tabular-nums ${
                                      done
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                        : current
                                          ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
                                          : "border-zinc-300 text-zinc-400 dark:border-zinc-700"
                                    }`}
                                  >
                                    {done ? "✓" : i + 1}
                                  </span>
                                  {step}
                                  {current ? "…" : ""}
                                </li>
                              );
                            })}
                          </ol>
                        ) : null}

                        {pkg.status === "FAILED" && pkg.failureReason ? (
                          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 dark:border-red-900 dark:bg-red-950">
                            <p className="text-[13px] font-semibold text-red-800 dark:text-red-200">
                              Build failed
                            </p>
                            <p className="mt-0.5 text-[13px] leading-5 text-red-700 dark:text-red-300">
                              {pkg.failureReason}
                            </p>
                            <button
                              type="button"
                              onClick={() => onRetry(pkg.id)}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-[13px] font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                            >
                              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                              Retry build
                            </button>
                          </div>
                        ) : null}

                        <h3 className="mt-3 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
                          Included artifacts
                        </h3>
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {pkg.contents.map((key) => (
                            <li
                              key={key}
                              className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-[12px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                            >
                              {key === "manifest" ? "Manifest / Checksums" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </li>
                          ))}
                        </ul>

                        <dl className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
                          <div>
                            <dt className="font-medium text-zinc-500 dark:text-zinc-400">Requirements</dt>
                            <dd className="mt-0.5 font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                              {pkg.requirementCount}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-zinc-500 dark:text-zinc-400">Tests</dt>
                            <dd className="mt-0.5 font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                              {pkg.testCount}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-zinc-500 dark:text-zinc-400">Criteria</dt>
                            <dd className="mt-0.5 font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                              {pkg.criteriaCount}
                            </dd>
                          </div>
                        </dl>

                        <p className="mt-2.5 font-mono text-[12px] break-all text-zinc-500 dark:text-zinc-400">
                          Checksum: {pkg.checksum}
                          <span className="font-sans"> — demo value, not a real checksum.</span>
                        </p>
                        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
                          Manifest status:{" "}
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {pkg.manifestStatus}
                          </span>
                        </p>

                        <h3 className="mt-3 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
                          Downloads
                        </h3>
                        <div className="mt-1.5">
                          <DownloadButtons
                            formats={pkg.formats}
                            disabledReason="Demo only — file generation is not implemented."
                          />
                          <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                            Downloads are unavailable in this demo — no files are generated.
                            See the <Link href="/requirements/REQ-003" className="font-medium text-zinc-700 underline underline-offset-4 dark:text-zinc-200">analysis pages</Link> for
                            the underlying data instead.
                          </p>
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
