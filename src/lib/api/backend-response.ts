import { NextResponse } from "next/server";
import { AuthRequiredError, getDataBackend } from "@/lib/data";
import type { DataBackend } from "@/lib/data";

export async function withDataBackend(
  handler: (backend: DataBackend) => Promise<Response> | Response,
): Promise<Response> {
  try {
    const backend = await getDataBackend();
    return await handler(backend);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        { message: error.message || "Authentication required." },
        { status: 401 },
      );
    }
    console.error("Data backend error", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected backend error.",
      },
      { status: 500 },
    );
  }
}
