import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoUser, listDemoImports } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

export const metadata = { title: "Imports" };

export const dynamic = "force-dynamic";

export default function ImportsPage() {
  const imports = listDemoImports(demoUser.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import history"
        description="Track past CSV imports, row counts, and validation outcomes. Demo store persists for this server process only."
        actions={
          <Link
            href="/imports/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            New import
          </Link>
        }
      />

      {imports.length === 0 ? (
        <EmptyState
          title="No imports yet"
          description="Upload a billing CSV to validate rows, preview accepted data, and populate the dashboard."
          action={
            <Link
              href="/imports/new"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Import a CSV
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Past imports</CardTitle>
            <CardDescription>
              {imports.length} import{imports.length === 1 ? "" : "s"} in demo
              memory
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="px-2 py-2 font-medium">File</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Accepted</th>
                  <th className="px-2 py-2 font-medium">Rejected</th>
                  <th className="px-2 py-2 font-medium">Duplicates</th>
                  <th className="px-2 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-2 py-3 font-medium">{item.filename}</td>
                    <td className="px-2 py-3">
                      <Badge variant="secondary">{item.status}</Badge>
                    </td>
                    <td className="px-2 py-3">{item.rowsProcessed}</td>
                    <td className="px-2 py-3">{item.rowsRejected}</td>
                    <td className="px-2 py-3">{item.rowsDuplicated}</td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("en-CA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
