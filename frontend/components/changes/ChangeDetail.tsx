"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Clock, Hourglass } from "lucide-react";
import { ChangeStatusBadge } from "@/components/changes/ChangeBadges";
import type { ChangeRecord } from "@/lib/changes-data";

type ActionState = "idle" | "confirming" | "confirmed" | "queued";

function HighlightedNew({ text, fragment }: { text: string; fragment: string }) {
  const index = text.indexOf(fragment);
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-100 px-0.5 font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        {fragment}
      </mark>
      {text.slice(index + fragment.length)}
    </>
  );
}

/**
 * Review workspace for one change: what changed → what was affected →
 * why it is stale → what to do. Actions are demo/local only.
 */
export default function ChangeDetail({ change }: { change: ChangeRecord }) {
  const [action, setAction] = useState<ActionState>("idle");
  const reviewable =
    change.status === "NEEDS REVIEW" || change.status === "RE-ANALYSIS REQUIRED";

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
          {change.id}
        </span>
        <ChangeStatusBadge value={change.status} />
        <span className="ml-auto font-mono text-[12px] text-zinc-400 tabular-nums dark:text-zinc-500">
          {change.date}
        </span>
      </div>

      {/* WHAT CHANGED */}
      <h3 className="mt-3 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
        What changed
      </h3>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white px-3.5 py-3 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="font-mono text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">
            OLD · {change.fromVersion}
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-600 line-through decoration-zinc-400 dark:text-zinc-400">
            “{change.oldText}”
          </p>
        </div>
        <div className="rounded-md border border-zinc-300 bg-white px-3.5 py-3 dark:border-zinc-600 dark:bg-zinc-950">
          <p className="font-mono text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
            NEW · {change.toVersion}
          </p>
          <p className="mt-1 text-sm leading-6 font-medium text-zinc-900 dark:text-zinc-50">
            “<HighlightedNew text={change.newText} fragment={change.changedFragment} />”
          </p>
        </div>
      </div>

      {/* WHAT WAS AFFECTED + WHY STALE */}
      <h3 className="mt-4 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
        What was affected
      </h3>
      <ul className="mt-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-950">
        {change.impacted.map((artifact) => (
          <li
            key={`${artifact.kind}-${artifact.id}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5"
          >
            <span className="text-[12px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {artifact.kind}
            </span>
            <Link
              href={artifact.href}
              className="font-mono text-[13px] font-semibold text-zinc-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-100"
            >
              {artifact.id}
            </Link>
            <span
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                artifact.state === "STALE"
                  ? "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              }`}
            >
              <Clock aria-hidden="true" className="h-3 w-3" />
              {artifact.state}
            </span>
            <span className="w-full text-[13px] text-zinc-500 dark:text-zinc-400">
              {artifact.state === "STALE"
                ? `This artifact was created against ${artifact.createdAgainst} — it predates the current wording.`
                : `Confirmed against ${artifact.createdAgainst}.`}
            </span>
          </li>
        ))}
      </ul>

      {/* VERSION HISTORY */}
      <h3 className="mt-4 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
        Version history
      </h3>
      <p aria-label={`Version history: ${change.versionHistory.join(" to ")}`} className="mt-2 flex flex-wrap items-center gap-2">
        {change.versionHistory.map((version, i) => {
          const isCurrent = version === change.currentVersion;
          return (
            <span key={version} className="inline-flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-500">
                  →
                </span>
              ) : null}
              <span
                className={`rounded-md border px-2.5 py-1 font-mono text-[13px] font-semibold tabular-nums ${
                  isCurrent
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                }`}
              >
                {version}
                {isCurrent ? " · current" : ""}
              </span>
            </span>
          );
        })}
      </p>

      {/* WHAT TO DO */}
      <h3 className="mt-4 text-[13px] font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
        What to do
      </h3>
      {action === "confirmed" ? (
        <p
          role="status"
          className="mt-2 flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Confirmed still valid. </span>
            Existing artifacts were reviewed against {change.toVersion} and kept as-is.
            Demo only — nothing was written to a backend.
          </span>
        </p>
      ) : action === "queued" ? (
        <p
          role="status"
          className="mt-2 flex items-start gap-2.5 rounded-md border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
        >
          <Hourglass aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Re-analysis queued. </span>
            The deterministic engine will re-assess this requirement. Demo only — no
            backend job was started.
          </span>
        </p>
      ) : reviewable ? (
        <div className="mt-2">
          {action === "confirming" ? (
            <div className="rounded-md border border-zinc-300 bg-white px-3.5 py-3 dark:border-zinc-600 dark:bg-zinc-950">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Confirm that the existing artifacts remain valid against{" "}
                <span className="font-mono font-semibold">{change.toVersion}</span>?
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction("confirmed")}
                  className="rounded-md bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Confirm still valid
                </button>
                <button
                  type="button"
                  onClick={() => setAction("idle")}
                  className="rounded-md border border-zinc-300 px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAction("queued")}
                className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Re-analyze
              </button>
              <button
                type="button"
                onClick={() => setAction("confirming")}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                Confirm Still Valid
              </button>
            </div>
          )}
          <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            Meaningful audit actions — demo only. Confirming keeps the stale states on
            record; re-analysis queues engine work without running it here.
          </p>
        </div>
      ) : (
        <p className="mt-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {change.status === "CONFIRMED VALID"
            ? "Previously confirmed still valid — no further action required."
            : "Accepted as editorial — no further action required."}
        </p>
      )}
    </div>
  );
}
