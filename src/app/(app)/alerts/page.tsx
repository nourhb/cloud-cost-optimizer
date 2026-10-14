import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getAlertsPlaceholderMessage } from "@/features/alerts";

export const metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Budget thresholds and unusual spend patterns surface here."
      />
      <EmptyState
        title="No alerts"
        description={getAlertsPlaceholderMessage()}
      />
    </div>
  );
}
