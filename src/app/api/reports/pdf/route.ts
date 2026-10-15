import { NextResponse } from "next/server";
import { renderReportPdf } from "@/features/reports";
import {
  demoUser,
  listDemoAlerts,
  listDemoBillingRecords,
  listDemoBudgets,
  listDemoRecommendations,
  refreshDemoInsights,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "PDF export with Supabase is not wired yet." },
      { status: 501 },
    );
  }

  refreshDemoInsights(demoUser.id);

  try {
    const buffer = await renderReportPdf({
      records: listDemoBillingRecords(demoUser.id),
      budgets: listDemoBudgets(demoUser.id),
      alerts: listDemoAlerts(demoUser.id),
      recommendations: listDemoRecommendations(demoUser.id),
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
}
