import { NextResponse } from "next/server";
import { getAppMode } from "@/lib/data";

export async function GET() {
  const mode = await getAppMode();
  const live = mode.kind === "supabase";

  return NextResponse.json({
    ok: true,
    service: "cloud-cost-optimizer",
    demoMode: !live,
    backend: mode.kind,
    connectionStatus: mode.status,
    milestone: "m2-supabase-ui",
    features: {
      csvImport: true,
      billingSummary: true,
      budgets: true,
      alerts: true,
      forecast: true,
      recommendations: true,
      reports: true,
      supabaseAuth: live,
      connectionUi: true,
    },
  });
}
