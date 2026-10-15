"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let browserClientKey: string | null = null;

/** Browser Supabase client (anon key only). Pass URL/anon from server or /api/connection. */
export function createBrowserSupabaseClient(
  url: string,
  anonKey: string,
): SupabaseClient {
  const key = `${url}::${anonKey}`;
  if (browserClient && browserClientKey === key) {
    return browserClient;
  }
  browserClient = createBrowserClient(url, anonKey);
  browserClientKey = key;
  return browserClient;
}

export function resetBrowserSupabaseClient(): void {
  browserClient = null;
  browserClientKey = null;
}
