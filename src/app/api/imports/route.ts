import { NextResponse } from "next/server";

/** Placeholder — CSV import API lands in M3. */
export function GET() {
  return NextResponse.json(
    {
      imports: [],
      message: "Import history API is not implemented in Milestone 1.",
    },
    { status: 501 },
  );
}

export function POST() {
  return NextResponse.json(
    { message: "CSV import is not implemented in Milestone 1." },
    { status: 501 },
  );
}
