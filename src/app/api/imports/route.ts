import { NextResponse } from "next/server";
import { CsvLimitError, CsvParseError, parseBillingCsv } from "@/features/imports";
import {
  createDemoImportPreview,
  demoUser,
  listDemoImports,
  markDemoImportFailed,
} from "@/lib/demo/store";
import { getEnv, isDemoMode } from "@/lib/env";


export function GET() {
  if (!isDemoMode()) {
    return NextResponse.json(
      {
        message:
          "Import history with Supabase is not wired yet. Enable NEXT_PUBLIC_DEMO_MODE=true.",
      },
      { status: 501 },
    );
  }

  return NextResponse.json({
    imports: listDemoImports(demoUser.id),
  });
}

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      {
        message:
          "CSV import with Supabase is not wired yet. Enable NEXT_PUBLIC_DEMO_MODE=true.",
      },
      { status: 501 },
    );
  }

  const env = getEnv();
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { message: "Expected multipart/form-data with a CSV file field named \"file\"." },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "Could not read the uploaded form data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Missing CSV file. Use the form field name \"file\"." },
      { status: 400 },
    );
  }

  if (file.size > env.CSV_MAX_BYTES) {
    return NextResponse.json(
      {
        message: `File exceeds the ${(env.CSV_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB size limit.`,
      },
      { status: 413 },
    );
  }

  const filename = file.name || "upload.csv";
  const content = await file.text();

  try {
    const parsed = parseBillingCsv(content, {
      maxBytes: env.CSV_MAX_BYTES,
      maxRows: env.CSV_MAX_ROWS,
    });

    if (parsed.missingColumns.length > 0) {
      return NextResponse.json(
        {
          message: `Missing required columns: ${parsed.missingColumns.join(", ")}.`,
          missingColumns: parsed.missingColumns,
        },
        { status: 400 },
      );
    }

    if (parsed.totalRows === 0) {
      return NextResponse.json(
        { message: "The CSV file has no data rows." },
        { status: 400 },
      );
    }

    if (parsed.accepted.length === 0) {
      const created = createDemoImportPreview({
        filename,
        accepted: [],
        rejected: parsed.rejected,
      });
      const failed =
        markDemoImportFailed(
          created.id,
          "All rows were rejected during validation.",
        ) ?? created;

      return NextResponse.json(
        {
          message: "All rows were rejected. Fix the CSV and try again.",
          import: failed,
          preview: {
            acceptedCount: 0,
            rejectedCount: parsed.rejected.length,
            sample: [],
            rejections: parsed.rejected.slice(0, 50),
          },
        },
        { status: 422 },
      );
    }

    const billingImport = createDemoImportPreview({
      filename,
      accepted: parsed.accepted,
      rejected: parsed.rejected,
    });

    return NextResponse.json({
      import: billingImport,
      preview: {
        acceptedCount: parsed.accepted.length,
        rejectedCount: parsed.rejected.length,
        sample: parsed.accepted.slice(0, 10),
        rejections: parsed.rejected.slice(0, 50),
      },
    });
  } catch (error) {
    if (error instanceof CsvLimitError) {
      return NextResponse.json({ message: error.message }, { status: 413 });
    }
    if (error instanceof CsvParseError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("CSV import failed", error);
    return NextResponse.json(
      { message: "Unexpected error while parsing the CSV." },
      { status: 500 },
    );
  }
}
