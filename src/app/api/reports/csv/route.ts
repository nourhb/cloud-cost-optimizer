import { NextResponse } from "next/server";
import { buildAnalysisSummaryCsv, buildBillingCsv } from "@/features/reports";
import { withDataBackend } from "@/lib/api/backend-response";

export async function GET(request: Request) {
  return withDataBackend(async (backend) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "billing";
    const records = await backend.listBillingRecords();

    const csv =
      kind === "summary"
        ? buildAnalysisSummaryCsv({
            records,
            budgets: await backend.listBudgets(),
            alerts: await backend.listAlerts(),
            recommendations: await backend.listRecommendations(),
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
  });
}
