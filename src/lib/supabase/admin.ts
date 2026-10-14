/**
 * Service-role Supabase client — SERVER ONLY.
 * Never import this module from Client Components or shared client barrels.
 * Never expose SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_*.
 * Stubbed in M1.
 */

export function createAdminSupabaseClient(): never {
  throw new Error(
    "Supabase admin client is not available in Milestone 1. Service role must stay server-only.",
  );
}
