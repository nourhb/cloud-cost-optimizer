import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getBillingPlaceholderMessage } from "@/features/billing";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Spend summary, trends, and month-end forecast will appear here once you import billing data."
      />
      <EmptyState
        title="No billing data yet"
        description={getBillingPlaceholderMessage()}
        action={
          <Link
            href="/imports/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Import a CSV
          </Link>
        }
      />
    </div>
  );
}
