import { PageHeader } from "@/components/layout/page-header";
import { RecommendationsPanel } from "@/features/recommendations/recommendations-panel";

export const metadata = { title: "Recommendations" };

export default function RecommendationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommendations"
        description="Explainable optimization ideas based on your billing history. Advisory only."
      />
      <RecommendationsPanel />
    </div>
  );
}
