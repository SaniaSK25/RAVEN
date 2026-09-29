import AttentionItem from "@/components/AttentionItem";
import DashboardLayout from "@/components/DashboardLayout";
import DistributionSection from "@/components/DistributionSection";
import SummaryCard from "@/components/SummaryCard";
import { getDashboardData } from "@/lib/dashboard-data";

export default function Home() {
  const data = getDashboardData();

  return (
    <DashboardLayout>
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Regulatory QA Overview
        </p>
      </div>

      {/* Summary cards */}
      <section
        aria-label="Summary"
        className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <SummaryCard
          label="Requirements"
          value={data.totalRequirements}
          subtext="In scope for this release"
        />
        <SummaryCard
          label="Scripted"
          value={data.assurance.scripted}
          subtext="Full scripted assurance"
        />
        <SummaryCard
          label="Exploratory"
          value={data.assurance.exploratory}
          subtext="Exploratory assurance"
        />
        <SummaryCard
          label="Supplier Assurance"
          value={data.assurance.supplierAssurance}
          subtext="Covered by supplier evidence"
        />
        <SummaryCard
          label="Needs Review"
          value={data.needsReview}
          subtext="Awaiting QA review"
        />
        <SummaryCard
          label="Changed"
          value={data.changed}
          subtext="Changed since assessment"
        />
        <SummaryCard
          label="Compliance Gaps"
          value={data.complianceGaps}
          subtext="Criteria not yet covered"
        />
      </section>

      {/* Distributions */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DistributionSection
          title="Risk Distribution"
          description="Requirements grouped by assessed risk level."
          rows={[
            {
              key: "low",
              label: "LOW",
              value: data.risk.low,
              barClassName: "bg-emerald-500",
              badgeClassName:
                "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
            },
            {
              key: "medium",
              label: "MEDIUM",
              value: data.risk.medium,
              barClassName: "bg-amber-400",
              badgeClassName:
                "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
            },
            {
              key: "high",
              label: "HIGH",
              value: data.risk.high,
              barClassName: "bg-red-500",
              badgeClassName:
                "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
            },
          ]}
        />
        <DistributionSection
          title="Assurance Distribution"
          description="Requirements grouped by assurance strategy."
          rows={[
            {
              key: "scripted",
              label: "SCRIPTED",
              value: data.assurance.scripted,
              barClassName: "bg-zinc-900 dark:bg-zinc-100",
              badgeClassName:
                "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
            },
            {
              key: "exploratory",
              label: "EXPLORATORY",
              value: data.assurance.exploratory,
              barClassName: "bg-sky-500",
              badgeClassName:
                "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
            },
            {
              key: "supplier",
              label: "SUPPLIER",
              value: data.assurance.supplierAssurance,
              barClassName: "bg-violet-400",
              badgeClassName:
                "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
            },
          ]}
        />
      </div>

      {/* Needs attention */}
      <section
        aria-label="Needs Attention"
        className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Needs Attention
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Items currently requiring QA follow-up.
        </p>
        <ul className="mt-5 space-y-2.5">
          {data.attention.map((item) => (
            <AttentionItem
              key={item.id}
              title={`${item.count} ${item.title}`}
              description={item.description}
              count={item.count}
            />
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
