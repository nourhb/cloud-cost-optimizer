import { PageHeader } from "@/components/layout/page-header";
import { ReportsPanel } from "@/features/reports/reports-panel";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Export analysis as CSV or PDF for stakeholders."
      />
      <ReportsPanel />
    </div>
  );
}
