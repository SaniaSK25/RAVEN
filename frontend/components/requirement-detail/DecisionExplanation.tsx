import { ChevronDown } from "lucide-react";

interface DecisionExplanationProps {
  /** Human-readable outcome-first explanation. */
  explanation: string;
  ruleId: string;
  decisionPath: string[];
  detailsLabel?: string;
}

/**
 * Progressive disclosure: explanation + rule ID up front, exact decision
 * path behind an expandable area.
 */
export default function DecisionExplanation({
  explanation,
  ruleId,
  decisionPath,
  detailsLabel = "View decision logic",
}: DecisionExplanationProps) {
  return (
    <div>
      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{explanation}</p>
      <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
        Rule <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-200">{ruleId}</span>
      </p>
      <details className="group mt-3 rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-open:rotate-180"
          />
          {detailsLabel}
        </summary>
        <ol className="space-y-1.5 border-t border-zinc-200 px-4 py-3 font-mono text-[13px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          {decisionPath.map((step, i) => (
            <li key={`${i}-${step}`} className="flex gap-2.5">
              <span aria-hidden="true" className="text-zinc-400 tabular-nums dark:text-zinc-500">
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
