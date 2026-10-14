/**
 * Server Supabase client (anon key + session cookies).
 * Stubbed in M1 — real wiring lands in M2.
 */

export async function createServerSupabaseClient(): Promise<null> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return null;
  }

  throw new Error(
    "Supabase server client is not configured in Milestone 1. Set NEXT_PUBLIC_DEMO_MODE=true.",
  );
}
