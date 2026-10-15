import { NextResponse } from "next/server";
import { previewSample } from "@/features/imports";
import { withDataBackend } from "@/lib/api/backend-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withDataBackend(async (backend) => {
    const { id } = await context.params;
    const billingImport = await backend.getImport(id);
    if (!billingImport) {
      return NextResponse.json({ message: "Import not found." }, { status: 404 });
    }

    const pending = await backend.getImportPending(id);

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
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withDataBackend(async (backend) => {
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

    const existing = await backend.getImport(id);
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

    const result = await backend.commitImport(id);
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
  });
}
