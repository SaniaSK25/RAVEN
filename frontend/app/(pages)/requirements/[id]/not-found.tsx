import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/** Shown for /requirements/[id] with an unknown ID. */
export default function RequirementNotFound() {
  return (
    <DashboardLayout>
      <Link
        href="/requirements"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to requirements
      </Link>
      <div className="mt-4 flex flex-col items-center rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
        >
          <FileSearch className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Requirement not found
        </h1>
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          No requirement with this ID exists in the current demo dataset. Check
          the ID or return to the list to search again.
        </p>
        <Link
          href="/requirements"
          className="mt-5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Back to requirements
        </Link>
      </div>
    </DashboardLayout>
  );
}
