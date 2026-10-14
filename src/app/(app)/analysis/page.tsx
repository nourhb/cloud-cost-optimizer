import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getBillingPlaceholderMessage } from "@/features/billing";

export const metadata = { title: "Analysis" };

export default function AnalysisPage() {
  return (
    <div>
      <PageHeader
        title="Analysis"
        description="Break down costs by service, region, environment, and period."
      />
      <EmptyState
        title="Nothing to analyze"
        description={getBillingPlaceholderMessage()}
      />
    </div>
  );
}
