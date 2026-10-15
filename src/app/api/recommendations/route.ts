import { NextResponse } from "next/server";
import {
  demoUser,
  listDemoRecommendations,
  refreshDemoInsights,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";

export function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Recommendations with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.get("refresh") === "1") {
    refreshDemoInsights(demoUser.id);
  }

  return NextResponse.json({
    recommendations: listDemoRecommendations(demoUser.id),
  });
}
