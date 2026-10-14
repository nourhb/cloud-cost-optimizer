import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { message: "Recommendations API lands in Milestone 6." },
    { status: 501 },
  );
}
