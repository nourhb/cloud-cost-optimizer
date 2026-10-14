/**
 * Browser Supabase client (anon key only).
 * Stubbed in M1 — real wiring lands in M2 when demo mode is off.
 */

export function createBrowserSupabaseClient(): null {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return null;
  }

  // M2: return createBrowserClient(url, anonKey)
  throw new Error(
    "Supabase browser client is not configured in Milestone 1. Set NEXT_PUBLIC_DEMO_MODE=true.",
  );
}
