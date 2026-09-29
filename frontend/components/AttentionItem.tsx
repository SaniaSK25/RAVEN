import { AlertTriangle, ChevronRight } from "lucide-react";

interface AttentionItemProps {
  title: string;
  description: string;
  count: number;
}

export default function AttentionItem({
  title,
  description,
  count,
}: AttentionItemProps) {
  return (
    <li>
      {/* Actionable look only — other pages are not built yet, so this does
          not navigate. Rendered as a button for keyboard access. */}
      <button
        type="button"
        className="flex w-full items-center gap-4 rounded-md border border-zinc-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </span>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 tabular-nums dark:bg-zinc-800 dark:text-zinc-200">
              {count}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
        />
      </button>
    </li>
  );
}
