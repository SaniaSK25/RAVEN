import { History } from "lucide-react";
import SectionCard from "@/components/requirement-detail/SectionCard";
import { statusLabel } from "@/lib/requirements-data";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

export default function ChangeSummary({ detail }: { detail: RequirementDetail }) {
  const changed = detail.status === "warning" || detail.status === "stale";

  return (
    <SectionCard
      id="changes"
      title="Changes"
      description="Version history. The full change-impact workflow is out of scope for this version."
    >
      {changed ? (
        <p
          role="status"
          className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <History aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {detail.status === "warning"
              ? "This requirement changed since its last assessment and is pending re-assessment."
              : "This requirement is stale — linked artefacts need re-assessment."}
          </span>
        </p>
      ) : null}

      <ol className="space-y-2.5">
        {[...detail.versions].reverse().map((v) => {
          const isCurrent = v.supersededAt === null;
          return (
            <li
              key={v.version}
              className="flex items-center gap-3 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                v{v.version.toFixed(1)}
              </span>
              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                {isCurrent ? "current" : statusLabel(v.status)}
              </span>
              {isCurrent ? (
                <span className="ml-auto inline-flex items-center rounded border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  CURRENT
                </span>
              ) : (
                <span className="ml-auto text-[13px] text-zinc-400 dark:text-zinc-500">historical</span>
              )}
            </li>
          );
        })}
      </ol>

      {detail.changes.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {detail.changes.map((change) => (
            <li
              key={change.id}
              className="rounded-md bg-zinc-50 px-4 py-3 text-[13px] leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                v{change.fromVersion.toFixed(1)} → v{change.toVersion.toFixed(1)}
              </span>
              {" — "}
              {change.summary}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-zinc-500 dark:text-zinc-400">
          No recorded changes — this is the initial version.
        </p>
      )}
    </SectionCard>
  );
}
