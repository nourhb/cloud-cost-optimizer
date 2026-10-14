import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getImportsPlaceholderMessage } from "@/features/imports";
import { cn } from "@/lib/utils";

export const metadata = { title: "Imports" };

export default function ImportsPage() {
  return (
    <div>
      <PageHeader
        title="Import history"
        description="Track past CSV imports, row counts, and validation outcomes."
        actions={
          <Link
            href="/imports/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            New import
          </Link>
        }
      />
      <EmptyState
        title="No imports yet"
        description={getImportsPlaceholderMessage()}
      />
    </div>
  );
}
