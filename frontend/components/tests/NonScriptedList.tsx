import Link from "next/link";
import { AssuranceBadge } from "@/components/requirements/RequirementBadges";
import type { NonScriptedInfo } from "@/lib/tests-data";

/**
 * Requirements correctly without formal tests — valid assurance outcomes,
 * not missing coverage.
 */
export default function NonScriptedList({ items }: { items: NonScriptedInfo[] }) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Requirements without formal tests"
      className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        No formal scripted test required
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {items.length} requirement{items.length === 1 ? "" : "s"} with non-scripted assurance.
        The assurance decision is the explanation for why no formal script exists.
      </p>
      <ul className="mt-4 divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((item) => (
          <li key={item.requirementId} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
            <Link
              href={`/requirements/${item.requirementId}?tab=tests`}
              className="font-mono text-[13px] font-semibold text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-50"
            >
              {item.requirementId}
            </Link>
            <span className="min-w-0 flex-1 basis-48 truncate text-[13px] text-zinc-500 dark:text-zinc-400">
              {item.title}
            </span>
            <AssuranceBadge value={item.assurance} />
          </li>
        ))}
      </ul>
    </section>
  );
}
