import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AssurancePanel from "@/components/requirement-detail/AssurancePanel";
import ChangeSummary from "@/components/requirement-detail/ChangeSummary";
import ComplianceSummary from "@/components/requirement-detail/ComplianceSummary";
import EvidencePanel from "@/components/requirement-detail/EvidencePanel";
import RequirementHeader from "@/components/requirement-detail/RequirementHeader";
import RiskSummary from "@/components/requirement-detail/RiskSummary";
import SectionCard from "@/components/requirement-detail/SectionCard";
import ScrollToSection from "@/components/requirement-detail/ScrollToSection";
import TestPreview from "@/components/requirement-detail/TestPreview";
import TraceabilityPreview from "@/components/requirement-detail/TraceabilityPreview";
import { assuranceLabel } from "@/lib/requirements-data";
import type { RequirementDetail } from "@/lib/requirement-detail-data";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "evidence", label: "Evidence" },
  { id: "risk", label: "Risk" },
  { id: "assurance", label: "Assurance" },
  { id: "tests", label: "Tests" },
  { id: "traceability", label: "Traceability" },
  { id: "changes", label: "Changes" },
  { id: "compliance", label: "Compliance" },
];

export default function RequirementDetailView({
  detail,
  initialTab,
}: {
  detail: RequirementDetail;
  initialTab?: string;
}) {
  const lowEvidence = detail.evidence.filter((e) => e.confidence === "low").length;

  return (
    <div>
      {initialTab === "risk" || initialTab === "assurance" || initialTab === "tests" ? (
        <ScrollToSection targetId={initialTab} />
      ) : null}
      <Link
        href="/requirements"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to requirements
      </Link>

      <div className="mt-4">
        <RequirementHeader detail={detail} />
      </div>

      <nav
        aria-label="Requirement sections"
        className="sticky top-0 z-10 -mx-6 mt-6 border-y border-zinc-200 bg-zinc-50/95 px-6 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-black/95"
      >
        <ul className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-1 gap-y-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-block rounded-md px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 space-y-4">
        <SectionCard
          id="overview"
          title="Overview"
          description="Result first — the lifecycle of this requirement at a glance."
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
              <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Risk summary</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {detail.risk} · RPN {detail.rpn}
              </dd>
              <dd className="mt-0.5 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                <a href="#risk" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Why this rating
                </a>
              </dd>
            </div>
            <div className="rounded-md border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
              <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Assurance summary</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {assuranceLabel(detail.assurance)}
              </dd>
              <dd className="mt-0.5 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                {detail.assurance === "scripted"
                  ? `${detail.tests.length} scripted test${detail.tests.length === 1 ? "" : "s"} — `
                  : "No formal scripted test — "}
                <a href="#assurance" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Why this outcome
                </a>
              </dd>
            </div>
            <div className="rounded-md border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
              <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Evidence</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {detail.evidence.length} facts
                {lowEvidence > 0 ? ` · ${lowEvidence} need review` : " · all confident"}
              </dd>
              <dd className="mt-0.5 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                <a href="#evidence" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Review evidence
                </a>
              </dd>
            </div>
            <div className="rounded-md border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
              <dt className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Version</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                {detail.version} · {detail.versions.length} version{detail.versions.length === 1 ? "" : "s"} on record
              </dd>
              <dd className="mt-0.5 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                <a href="#changes" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Version history
                </a>
              </dd>
            </div>
          </dl>
        </SectionCard>

        <EvidencePanel detail={detail} />
        <RiskSummary detail={detail} />
        <AssurancePanel detail={detail} />
        <TestPreview detail={detail} />
        <TraceabilityPreview detail={detail} />
        <ChangeSummary detail={detail} />
        <ComplianceSummary detail={detail} />
      </div>

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo data — not connected. Risk and assurance values display recorded
        rule-engine decisions; this page does not re-score risk.
      </p>
    </div>
  );
}
