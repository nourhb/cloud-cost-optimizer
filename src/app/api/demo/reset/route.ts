import { NextResponse } from "next/server";
import { getAppMode } from "@/lib/data";
import { resetDemoStore } from "@/lib/demo/store";

/** Clears the in-memory demo store. Demo mode only — for local/e2e isolation. */
export async function POST() {
  const mode = await getAppMode();
  if (mode.kind !== "demo") {
    return NextResponse.json(
      {
        message:
          "Demo reset is only available when Supabase is not configured (demo mode).",
      },
      { status: 403 },
    );
  }

  resetDemoStore();
  return NextResponse.json({ ok: true, message: "Demo store cleared." });
}
