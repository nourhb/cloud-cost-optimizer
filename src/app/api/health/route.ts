import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "cloud-cost-optimizer",
    demoMode: isDemoMode(),
    milestone: "mvp-demo",
    features: {
      csvImport: isDemoMode(),
      billingSummary: isDemoMode(),
      budgets: isDemoMode(),
      alerts: isDemoMode(),
      forecast: isDemoMode(),
      recommendations: isDemoMode(),
      reports: isDemoMode(),
    },
  });
}
