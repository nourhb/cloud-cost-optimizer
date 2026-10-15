import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_CONFIG_COOKIE,
  resolveSupabaseConfigFromSources,
  type SupabaseProjectConfig,
} from "@/lib/supabase/config";

export async function getServerSupabaseConfig(): Promise<SupabaseProjectConfig | null> {
  const cookieStore = await cookies();
  return resolveSupabaseConfigFromSources({
    cookieValue: cookieStore.get(SUPABASE_CONFIG_COOKIE)?.value,
  });
}

/** Session-bound server client (anon key + cookies). Null when not configured → DEMO_MODE. */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const config = await getServerSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component without mutable cookies — proxy handles refresh.
        }
      },
    },
  });
}
