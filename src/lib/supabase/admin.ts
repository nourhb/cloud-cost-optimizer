/**
 * Service-role Supabase client — SERVER ONLY.
 * Never import from Client Components. Never expose via NEXT_PUBLIC_*.
 * MVP CRUD uses the session-bound anon client + RLS; admin is optional maintenance only.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseConfig } from "@/lib/supabase/server";

export async function createAdminSupabaseClient(): Promise<SupabaseClient> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is server-only and optional for MVP CRUD (use anon + RLS).",
    );
  }

  const config = await getServerSupabaseConfig();
  if (!config) {
    throw new Error("Supabase URL is not configured.");
  }

  return createClient(config.url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
