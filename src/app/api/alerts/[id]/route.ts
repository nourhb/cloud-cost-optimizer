import { NextResponse } from "next/server";
import { acknowledgeDemoAlert, demoUser } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Alerts with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const { id } = await context.params;
  let body: { action?: string } = {};
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    body = {};
  }

  if (body.action !== "acknowledge") {
    return NextResponse.json(
      { message: 'Unsupported action. Send { "action": "acknowledge" }.' },
      { status: 400 },
    );
  }

  const alert = acknowledgeDemoAlert(id, demoUser.id);
  if (!alert) {
    return NextResponse.json({ message: "Alert not found." }, { status: 404 });
  }
  return NextResponse.json({ alert });
}
