import { notFound } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementDetailView from "@/components/requirement-detail/RequirementDetailView";
import { getRequirementDetail } from "@/lib/requirement-detail-data";

interface RequirementDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Requirement Detail — the central QA investigation screen.
 * Thin server wrapper: look up the demo detail model and render the view.
 * A nonexistent ID renders the route not-found state.
 * `?tab=risk` (used by the Assessments workspace) scrolls to the risk section.
 */
export default async function RequirementDetailPage({ params, searchParams }: RequirementDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const detail = getRequirementDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <DashboardLayout>
      <RequirementDetailView detail={detail} initialTab={tab} />
    </DashboardLayout>
  );
}
