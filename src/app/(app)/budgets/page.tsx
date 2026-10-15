import { PageHeader } from "@/components/layout/page-header";
import { BudgetsPanel } from "@/features/budgets/budgets-panel";

export const metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Create and edit monthly global or per-service budgets with warning and critical thresholds."
      />
      <BudgetsPanel />
    </div>
  );
}
