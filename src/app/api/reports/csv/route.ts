import { NextResponse } from "next/server";
import { buildAnalysisSummaryCsv, buildBillingCsv } from "@/features/reports";
import {
  demoUser,
  listDemoAlerts,
  listDemoBillingRecords,
  listDemoBudgets,
  listDemoRecommendations,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";

export function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "CSV export with Supabase is not wired yet." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "billing";
  const records = listDemoBillingRecords(demoUser.id);

  const csv =
    kind === "summary"
      ? buildAnalysisSummaryCsv({
          records,
          budgets: listDemoBudgets(demoUser.id),
          alerts: listDemoAlerts(demoUser.id),
          recommendations: listDemoRecommendations(demoUser.id),
        })
      : buildBillingCsv(records);

  const filename =
    kind === "summary" ? "analysis-summary.csv" : "billing-records.csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
