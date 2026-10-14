import { NextResponse } from "next/server";

/** Placeholder — import detail API lands in M3. */
export function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return context.params.then(({ id }) =>
    NextResponse.json(
      {
        id,
        message: "Import detail API is not implemented in Milestone 1.",
      },
      { status: 501 },
    ),
  );
}
