import { Unlink } from "lucide-react";
import type { OrphanArtifact } from "@/lib/traceability-data";

const GROUPS: Array<{
  kind: OrphanArtifact["kind"];
  label: string;
  description: string;
}> = [
  {
    kind: "Requirement",
    label: "Uncovered requirements",
    description: "Active requirements without fresh test coverage or an eligible non-scripted assurance decision.",
  },
  {
    kind: "Test",
    label: "Unlinked test scripts",
    description: "Test scripts without an active link to a requirement.",
  },
  {
    kind: "Risk",
    label: "Risks without assurance",
    description: "Fresh risk assessments without a fresh assurance decision.",
  },
  {
    kind: "Assurance",
    label: "Unlinked assurance decisions",
    description: "Assurance records without the expected active risk link.",
  },
];

/** Collapsed review of coverage gaps and artifacts missing expected links. */
export default function OrphanList({ orphans }: { orphans: OrphanArtifact[] }) {
  if (orphans.length === 0) return null;

  return (
    <details className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-zinc-800 marker:hidden dark:text-zinc-100">
        <Unlink aria-hidden="true" className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        Coverage gaps and unlinked records
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {orphans.length}
        </span>
      </summary>
      <div className="space-y-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
        {GROUPS.map((group) => {
          const groupOrphans = orphans.filter((orphan) => orphan.kind === group.kind);
          if (groupOrphans.length === 0) return null;
          return (
            <details
              key={group.kind}
              className="rounded-md border border-zinc-200 dark:border-zinc-800"
            >
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {group.label} · {groupOrphans.length}
              </summary>
              <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="mb-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {group.description}
                </p>
                <ul className="space-y-2">
                  {groupOrphans.map((orphan) => (
                    <li
                      key={`${orphan.kind}:${orphan.id}`}
                      className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
                    >
                      <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {orphan.id}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        {orphan.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </div>
    </details>
  );
}
