import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getImportsPlaceholderMessage } from "@/features/imports";

export const metadata = { title: "New import" };

export default function NewImportPage() {
  return (
    <div>
      <PageHeader
        title="New import"
        description="Upload a billing CSV for preview and validation. Commit lands in Milestone 3."
      />
      <EmptyState
        title="CSV upload coming soon"
        description={getImportsPlaceholderMessage()}
      />
    </div>
  );
}
