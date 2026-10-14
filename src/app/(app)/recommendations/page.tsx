import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getRecommendationsPlaceholderMessage } from "@/features/recommendations";

export const metadata = { title: "Recommendations" };

export default function RecommendationsPage() {
  return (
    <div>
      <PageHeader
        title="Recommendations"
        description="Explainable optimization ideas based on your billing history."
      />
      <EmptyState
        title="No recommendations yet"
        description={getRecommendationsPlaceholderMessage()}
      />
    </div>
  );
}
