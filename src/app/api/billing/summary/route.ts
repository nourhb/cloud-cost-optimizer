import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { message: "Billing summary API lands in Milestone 4." },
    { status: 501 },
  );
}
