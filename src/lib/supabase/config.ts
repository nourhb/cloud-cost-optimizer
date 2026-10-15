import { z } from "zod";

/** Cookie holding UI-saved Supabase connection (server-readable; anon key is public by design). */
export const SUPABASE_CONFIG_COOKIE = "cco_supabase_config";

const cookieSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(20),
});

export type SupabaseProjectConfig = {
  url: string;
  anonKey: string;
  source: "env" | "cookie";
};

export type ConnectionStatus =
  | "connected"
  | "missing_config"
  | "invalid_config"
  | "auth_error";

export function parseSupabaseConfigJson(
  raw: string,
): { url: string; anonKey: string } | null {
  try {
    const parsed = cookieSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function encodeSupabaseConfigCookie(input: {
  url: string;
  anonKey: string;
}): string {
  const parsed = cookieSchema.parse({
    url: input.url.trim().replace(/\/$/, ""),
    anonKey: input.anonKey.trim(),
  });
  return JSON.stringify(parsed);
}

export function configFromEnv(): SupabaseProjectConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  const parsed = cookieSchema.safeParse({ url, anonKey });
  if (!parsed.success) {
    return null;
  }
  return {
    url: parsed.data.url.replace(/\/$/, ""),
    anonKey: parsed.data.anonKey,
    source: "env",
  };
}

export function configFromCookieValue(
  cookieValue: string | undefined | null,
): SupabaseProjectConfig | null {
  if (!cookieValue) {
    return null;
  }
  const parsed = parseSupabaseConfigJson(cookieValue);
  if (!parsed) {
    return null;
  }
  return {
    url: parsed.url.replace(/\/$/, ""),
    anonKey: parsed.anonKey,
    source: "cookie",
  };
}

/**
 * Resolve project config: UI cookie wins (local connect flow), then env.
 * Returns null when neither is configured → app runs in DEMO_MODE.
 */
export function resolveSupabaseConfigFromSources(input: {
  cookieValue?: string | null;
}): SupabaseProjectConfig | null {
  return configFromCookieValue(input.cookieValue) ?? configFromEnv();
}

/** Sync demo detection for env-only call sites / tests. Cookie-aware mode uses getAppMode(). */
export function isEnvDemoMode(): boolean {
  const demoFlag = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (configFromEnv()) {
    return false;
  }
  return demoFlag === "true" || demoFlag === undefined || demoFlag === "";
}

export function validateSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
