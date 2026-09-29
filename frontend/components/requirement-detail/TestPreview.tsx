import { FlaskConical } from "lucide-react";
import SectionCard from "@/components/requirement-detail/SectionCard";
import { assuranceLabel } from "@/lib/requirements-data";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

function testStatusClass(status: string): string {
  if (status === "approved")
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  if (status === "in-review")
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  return "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200";
}

function testStatusLabel(status: string): string {
  if (status === "in-review") return "IN REVIEW";
  return status.toUpperCase();
}

export default function TestPreview({ detail }: { detail: RequirementDetail }) {
  if (detail.tests.length === 0) {
    return (
      <SectionCard
        id="tests"
        title="Tests"
        description="Test preview. Full test management is out of scope for this version."
      >
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            No formal scripted test required.{" "}
          </span>
          Assurance outcome is {assuranceLabel(detail.assurance)} — {detail.assuranceDetail.rationale}
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      id="tests"
      title="Tests"
      description={`${detail.tests.length} scripted test${detail.tests.length === 1 ? "" : "s"}. Full test management is out of scope for this version.`}
    >
      <ul className="space-y-3">
        {detail.tests.map((test) => (
          <li
            key={test.id}
            className="rounded-md border border-zinc-200 px-4 py-3.5 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              <FlaskConical aria-hidden="true" className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <span className="font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
                {test.id}
              </span>
              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${testStatusClass(test.status)}`}>
                {testStatusLabel(test.status)}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {test.purpose}
            </p>
            <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
              Preconditions: {test.preconditions}
            </p>
            <ol className="mt-2.5 space-y-1.5 border-t border-zinc-100 pt-2.5 text-[13px] dark:border-zinc-800">
              {test.steps.map((step) => (
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
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
