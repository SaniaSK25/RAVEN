import SectionCard from "@/components/requirement-detail/SectionCard";
import { assuranceLabel, statusLabel } from "@/lib/requirements-data";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

/** Compact preview of Requirement → Risk → Assurance → Test. Not the full graph. */
export default function TraceabilityPreview({ detail }: { detail: RequirementDetail }) {
  const nodes = [
    { label: "Requirement", value: detail.id, hint: statusLabel(detail.status) },
    { label: "Risk", value: `${detail.risk} · RPN ${detail.rpn}`, hint: detail.riskDetail.ruleId },
    { label: "Assurance", value: assuranceLabel(detail.assurance), hint: detail.assuranceDetail.ruleId },
    ...detail.tests.map((t) => ({
      label: "Test",
      value: t.id,
      hint: t.status,
    })),
  ];

  return (
    <SectionCard
      id="traceability"
      title="Traceability"
      description="Preview of the requirement lifecycle chain. The full graph/matrix view is out of scope for this version."
    >
      <ol aria-label="Lifecycle chain">
        {nodes.map((node, i) => (
          <li key={`${node.label}-${node.value}`} className="flex gap-3">
            <span aria-hidden="true" className="flex flex-col items-center">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-400 bg-white dark:border-zinc-500 dark:bg-zinc-950" />
              {i < nodes.length - 1 ? (
                <span className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              ) : null}
            </span>
            <div className={i < nodes.length - 1 ? "pb-4" : ""}>
              <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{node.label}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{node.value}</p>
              <p className="font-mono text-[12px] text-zinc-400 dark:text-zinc-500">{node.hint}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
