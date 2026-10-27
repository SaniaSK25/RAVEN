"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

/**
 * Route-level error boundary for every page in the workspace. Without this,
 * a runtime render error unmounts the React tree and leaves a blank screen;
 * here the failure is surfaced with a retry action instead.
 */
export default function PagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page render failed:", error);
  }, [error]);

  return (
    <section
      role="alert"
      className="mx-auto mt-10 w-full max-w-2xl rounded-xl border border-red-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-red-900 dark:bg-zinc-950"
    >
      <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
        <AlertCircle aria-hidden="true" className="h-5 w-5" />
        This page could not be rendered
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {error.message || "An unexpected error occurred while rendering this page."}
      </p>
      {error.digest ? (
        <p className="mt-1 font-mono text-xs text-zinc-400">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
