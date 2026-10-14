import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { message: "PDF export lands in Milestone 6." },
    { status: 501 },
  );
}
