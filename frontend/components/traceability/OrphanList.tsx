import { Unlink } from "lucide-react";
import type { OrphanArtifact } from "@/lib/traceability-data";

/** Compact orphan inspection — demo cases with no linked counterpart. */
export default function OrphanList({ orphans }: { orphans: OrphanArtifact[] }) {
  if (orphans.length === 0) return null;

  return (
    <section
      aria-label="Orphaned artifacts"
      className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Orphaned artifacts
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {orphans.length} artifact{orphans.length === 1 ? "" : "s"} with no linked counterpart.
        Demo cases so the state can be inspected.
      </p>
      <ul className="mt-4 space-y-2.5">
        {orphans.map((orphan) => (
          <li
            key={orphan.id}
            className="flex items-start gap-3 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <Unlink className="h-4 w-4" />
            </span>
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                  {orphan.id}
                </span>
                <span className="inline-flex items-center rounded border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-zinc-700 uppercase dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  {orphan.kind} · Orphan
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] text-zinc-500 dark:text-zinc-400">
                {orphan.reason}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
