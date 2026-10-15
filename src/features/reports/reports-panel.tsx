"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ReportsPanel() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function download(url: string, fallbackName: string) {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          setError(data.message ?? "Export failed.");
          return;
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fallbackName;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      } catch {
        setError("Network error while exporting.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export</CardTitle>
        <CardDescription>
          Download tabular CSV or a PDF report covering totals, budgets, alerts,
          forecast, and recommendations from the current demo store.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => download("/api/reports/csv?kind=billing", "billing-records.csv")}
        >
          Download billing CSV
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            download("/api/reports/csv?kind=summary", "analysis-summary.csv")
          }
        >
          Download summary CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            download("/api/reports/pdf", "cloud-cost-optimizer-report.pdf")
          }
        >
          Download PDF report
        </Button>
        {error ? (
          <p className="w-full text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
