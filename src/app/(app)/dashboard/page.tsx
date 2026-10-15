import { PageHeader } from "@/components/layout/page-header";
import { BillingDashboard } from "@/features/billing/billing-dashboard";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Spend summary and trends from imported billing data. Demo mode uses an in-memory store (no Supabase)."
      />
      <BillingDashboard />
    </div>
  );
}
