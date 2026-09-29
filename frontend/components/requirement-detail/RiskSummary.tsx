import DecisionExplanation from "@/components/requirement-detail/DecisionExplanation";
import SectionCard from "@/components/requirement-detail/SectionCard";
import { RiskBadge } from "@/components/requirements/RequirementBadges";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

export default function RiskSummary({ detail }: { detail: RequirementDetail }) {
  const risk = detail.riskDetail;

  return (
    <SectionCard
      id="risk"
      title="Risk"
      description="Deterministic assessment result. The frontend displays this decision; it does not re-score risk."
    >
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge value={risk.band} />
        <span className="text-sm text-zinc-600 tabular-nums dark:text-zinc-300">
          RPN <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{risk.rpn}</span>
          <span aria-hidden="true"> · </span>
          {risk.severity} × {risk.probability} × {risk.detectability}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Severity</dt>
          <dd className="mt-0.5 text-xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">{risk.severity}</dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Probability</dt>
          <dd className="mt-0.5 text-xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">{risk.probability}</dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Detectability</dt>
          <dd className="mt-0.5 text-xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">{risk.detectability}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <DecisionExplanation
          explanation={risk.reasoning}
          ruleId={risk.ruleId}
          decisionPath={risk.decisionPath}
        />
      </div>
    </SectionCard>
  );
}
