import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "cloud-cost-optimizer",
    demoMode: isDemoMode(),
    milestone: 1,
  });
}
