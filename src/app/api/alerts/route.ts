import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { message: "Alerts API lands in Milestone 5." },
    { status: 501 },
  );
}
