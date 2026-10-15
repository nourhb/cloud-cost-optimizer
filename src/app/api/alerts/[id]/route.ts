import { NextResponse } from "next/server";
import { withDataBackend } from "@/lib/api/backend-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withDataBackend(async (backend) => {
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

    const alert = await backend.acknowledgeAlert(id);
    if (!alert) {
      return NextResponse.json({ message: "Alert not found." }, { status: 404 });
    }
    return NextResponse.json({ alert });
  });
}
