import { NextResponse } from "next/server";
import { resetDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";


/** Clears the in-memory demo store. Demo mode only — for local/e2e isolation. */
export function POST() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Demo reset is only available when NEXT_PUBLIC_DEMO_MODE=true." },
      { status: 403 },
    );
  }

  resetDemoStore();
  return NextResponse.json({ ok: true, message: "Demo store cleared." });
}
