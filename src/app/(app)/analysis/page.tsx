import { PageHeader } from "@/components/layout/page-header";
import { BillingDashboard } from "@/features/billing/billing-dashboard";

export const metadata = { title: "Analysis" };

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis"
        description="Break down costs by service, region, environment, provider, and period."
      />
      <BillingDashboard title="Analysis" showTopServices />
    </div>
  );
}
