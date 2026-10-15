import { NextResponse } from "next/server";
import {
  demoUser,
  listDemoAlerts,
  refreshDemoInsights,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";

export function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Alerts with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  if (refresh) {
    refreshDemoInsights(demoUser.id);
  }

  const alerts = listDemoAlerts(demoUser.id);
  return NextResponse.json({
    alerts,
    openCount: alerts.filter((alert) => alert.status === "open").length,
  });
}
