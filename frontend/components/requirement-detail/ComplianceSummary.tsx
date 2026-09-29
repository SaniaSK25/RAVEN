import SectionCard from "@/components/requirement-detail/SectionCard";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

function coverageClass(status: string): string {
  if (status === "covered")
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (status === "partial")
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
}

export default function ComplianceSummary({ detail }: { detail: RequirementDetail }) {
  const covered = detail.compliance.filter((c) => c.status === "covered").length;
  const partial = detail.compliance.filter((c) => c.status === "partial").length;
  const absent = detail.compliance.filter((c) => c.status === "absent").length;
  const exampleGap = detail.compliance.find((c) => c.gaps.length > 0);

  return (
    <SectionCard
      id="compliance"
      title="Compliance"
      description="Coverage preview. The full compliance analysis is out of scope for this version."
    >
      <p className="text-sm text-zinc-600 tabular-nums dark:text-zinc-300" aria-label={`Covered ${covered}, partial ${partial}, absent ${absent}`}>
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">Covered: {covered}</span>
        <span aria-hidden="true"> · </span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">Partial: {partial}</span>
        <span aria-hidden="true"> · </span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">Absent: {absent}</span>
      </p>

      <ul className="mt-4 space-y-2.5">
        {detail.compliance.map((criterion) => (
          <li
            key={criterion.id}
            className="rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
                {criterion.code}
              </span>
              <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${coverageClass(criterion.status)}`}
              >
                {criterion.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{criterion.title}</p>
          </li>
        ))}
      </ul>

      {exampleGap ? (
        <p className="mt-3 rounded-md bg-zinc-50 px-4 py-3 text-[13px] leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Example gap ({exampleGap.code}): </span>
          {exampleGap.gaps[0]}
        </p>
      ) : null}
    </SectionCard>
  );
}
