import { PageHeader } from "@/components/layout/page-header";
import { AlertsPanel } from "@/features/alerts/alerts-panel";

export const metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Budget thresholds and unusual spend patterns. Recomputed on import and dashboard refresh."
      />
      <AlertsPanel />
    </div>
  );
}
