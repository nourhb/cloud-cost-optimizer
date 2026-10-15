import { NextResponse } from "next/server";
import { withDataBackend } from "@/lib/api/backend-response";

export async function GET(request: Request) {
  return withDataBackend(async (backend) => {
    const url = new URL(request.url);
    if (url.searchParams.get("refresh") === "1") {
      await backend.refreshInsights();
    }
    return NextResponse.json({
      recommendations: await backend.listRecommendations(),
    });
  });
}
