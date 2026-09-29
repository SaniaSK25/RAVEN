import { AlertTriangle } from "lucide-react";
import SectionCard from "@/components/requirement-detail/SectionCard";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

function confidenceClass(confidence: string): string {
  if (confidence === "high")
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (confidence === "medium")
    return "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200";
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
}

export default function EvidencePanel({ detail }: { detail: RequirementDetail }) {
  const lowCount = detail.evidence.filter((e) => e.confidence === "low").length;

  return (
    <SectionCard
      id="evidence"
      title="Evidence"
      description={
        lowCount > 0
          ? `${detail.evidence.length} extracted facts · ${lowCount} need${lowCount === 1 ? "s" : ""} review.`
          : `${detail.evidence.length} extracted facts.`
      }
    >
      <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {detail.evidence.map((fact) => (
          <li key={fact.id} className="px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {fact.label}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{fact.value}</span>
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${confidenceClass(fact.confidence)}`}
              >
                {fact.confidence === "low" ? (
                  <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                ) : null}
                {fact.confidence === "low" ? "Needs Review" : `${fact.confidence} confidence`}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
              {fact.summary}{" "}
              <span className="text-zinc-400 dark:text-zinc-500">— {fact.source}</span>
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
