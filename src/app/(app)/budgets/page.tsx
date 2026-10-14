import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getBudgetsPlaceholderMessage } from "@/features/budgets";

export const metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Define monthly budgets and warning thresholds for your cloud spend."
      />
      <EmptyState
        title="No budgets configured"
        description={getBudgetsPlaceholderMessage()}
      />
    </div>
  );
}
