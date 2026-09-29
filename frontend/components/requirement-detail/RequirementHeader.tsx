import { AlertTriangle, Clock } from "lucide-react";
import {
  AssuranceBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/requirements/RequirementBadges";
import { statusHint } from "@/lib/requirements-data";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

function attentionMessage(detail: RequirementDetail): string | null {
  if (detail.status === "needs-review") return "Awaiting QA review — evidence or assessment needs confirmation.";
  if (detail.status === "warning") return "Changed since assessment — re-assessment is pending.";
  if (detail.status === "stale") return "Stale — the source or linked artefacts changed; re-assessment is due.";
  return null;
}

/** Page header: what is this requirement, is it risky, how assured, attention? */
export default function RequirementHeader({ detail }: { detail: RequirementDetail }) {
  const attention = attentionMessage(detail);
  const AttentionIcon = detail.status === "stale" ? Clock : AlertTriangle;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-mono font-semibold text-zinc-500 dark:text-zinc-400">
          {detail.id}
        </span>
        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="text-zinc-500 tabular-nums dark:text-zinc-400">{detail.version}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          <RiskBadge value={detail.risk} />
          <AssuranceBadge value={detail.assurance} />
          <StatusBadge value={detail.status} />
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {detail.title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {detail.description}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-4 dark:border-zinc-800">
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">RPN</dt>
          <dd className="mt-0.5 text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
            {detail.rpn}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Risk factors</dt>
          <dd className="mt-0.5 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
            {detail.riskDetail.severity} × {detail.riskDetail.probability} × {detail.riskDetail.detectability}
          </dd>
          <dd className="text-[13px] text-zinc-500 dark:text-zinc-400">Severity × Probability × Detectability</dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">GAMP category</dt>
          <dd className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{detail.gampCategory}</dd>
          <dd className="text-[13px] text-zinc-500 dark:text-zinc-400">
            GxP impact: {detail.gxpImpact ? "Yes" : "No"}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Review state</dt>
          <dd className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {statusHint(detail.status) ?? "No open actions"}
          </dd>
        </div>
      </dl>

      {attention ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <AttentionIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Needs attention. </span>
            {attention}
          </span>
        </p>
      ) : null}
    </div>
  );
}
