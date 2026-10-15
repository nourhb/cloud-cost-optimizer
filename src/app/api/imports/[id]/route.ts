import { NextResponse } from "next/server";
import {
  commitDemoImport,
  demoUser,
  getDemoImport,
  getDemoImportPending,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { previewSample } from "@/features/imports";


type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Import detail with Supabase is not wired yet." },
      { status: 501 },
    );
  }

  const { id } = await context.params;
  const billingImport = getDemoImport(id, demoUser.id);
  if (!billingImport) {
    return NextResponse.json({ message: "Import not found." }, { status: 404 });
  }

  const pending = getDemoImportPending(id);

  return NextResponse.json({
    import: billingImport,
    preview:
      pending !== null
        ? {
            acceptedCount: pending.length,
            rejectedCount: billingImport.rowsRejected,
            sample: previewSample(pending, 10),
            rejections: billingImport.errorSummary?.rejections ?? [],
          }
        : null,
  });
}

export async function POST(request: Request, context: RouteContext) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Import commit with Supabase is not wired yet." },
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

  if (body.action !== "commit") {
    return NextResponse.json(
      { message: 'Unsupported action. Send { "action": "commit" }.' },
      { status: 400 },
    );
  }

  const existing = getDemoImport(id, demoUser.id);
  if (!existing) {
    return NextResponse.json({ message: "Import not found." }, { status: 404 });
  }
  if (existing.status === "committed") {
    return NextResponse.json({
      import: existing,
      inserted: existing.rowsProcessed,
      duplicated: existing.rowsDuplicated,
      message: "Import was already committed.",
    });
  }
  if (existing.status !== "previewed") {
    return NextResponse.json(
      { message: `Cannot commit an import in status "${existing.status}".` },
      { status: 409 },
    );
  }

  const result = commitDemoImport(id, demoUser.id);
  if (!result) {
    return NextResponse.json(
      { message: "Preview data expired. Upload the CSV again." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    import: result.import,
    inserted: result.inserted,
    duplicated: result.duplicated,
  });
}
