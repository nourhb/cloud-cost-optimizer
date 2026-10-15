import { NextResponse } from "next/server";
import { renderReportPdf } from "@/features/reports";
import { withDataBackend } from "@/lib/api/backend-response";

export async function GET() {
  return withDataBackend(async (backend) => {
    await backend.refreshInsights();

    try {
      const buffer = await renderReportPdf({
        records: await backend.listBillingRecords(),
        budgets: await backend.listBudgets(),
        alerts: await backend.listAlerts(),
        recommendations: await backend.listRecommendations(),
        generatedAt: new Date().toISOString(),
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="cloud-cost-optimizer-report.pdf"',
        },
      });
    } catch (error) {
      console.error("PDF render failed", error);
      return NextResponse.json(
        { message: "Failed to render PDF report." },
        { status: 500 },
      );
    }
  });
}
