import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getReportsPlaceholderMessage } from "@/features/reports";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export analysis as CSV or PDF for stakeholders."
      />
      <EmptyState
        title="No reports yet"
        description={getReportsPlaceholderMessage()}
      />
    </div>
  );
}
