import DecisionExplanation from "@/components/requirement-detail/DecisionExplanation";
import SectionCard from "@/components/requirement-detail/SectionCard";
import { AssuranceBadge } from "@/components/requirements/RequirementBadges";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

export default function AssurancePanel({ detail }: { detail: RequirementDetail }) {
  const assurance = detail.assuranceDetail;

  return (
    <SectionCard
      id="assurance"
      title="Assurance"
      description="How this requirement is assured, and why."
    >
      <div className="flex flex-wrap items-center gap-3">
        <AssuranceBadge value={assurance.outcome} />
        {assurance.generateTest ? (
          <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
            Formal tests are generated for this outcome.
          </span>
        ) : (
          <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
            No formal scripted test is generated for this outcome.
          </span>
        )}
      </div>
      <div className="mt-4">
        <DecisionExplanation
          explanation={assurance.rationale}
          ruleId={assurance.ruleId}
          decisionPath={assurance.decisionPath}
        />
      </div>
    </SectionCard>
  );
}
