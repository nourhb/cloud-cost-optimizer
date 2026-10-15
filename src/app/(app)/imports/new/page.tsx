import { PageHeader } from "@/components/layout/page-header";
import { ImportUploadForm } from "@/features/imports/import-upload-form";

export const metadata = { title: "New import" };

export default function NewImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New import"
        description="Upload a billing CSV, review validation results, then confirm to load spend into the demo store."
      />
      <ImportUploadForm />
    </div>
  );
}
