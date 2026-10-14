import DashboardLayout from "@/components/DashboardLayout";

/** Loading skeleton for the detail route (instant with demo data; ready for API). */
export default function RequirementDetailLoading() {
  return (
    <DashboardLayout>
      <div aria-busy="true" aria-label="Loading requirement detail">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-4 dark:border-zinc-800">
            {["a", "b", "c", "d"].map((key) => (
              <div key={key} className="h-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {["e", "f", "g"].map((key) => (
            <div
              key={key}
              className="h-40 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
