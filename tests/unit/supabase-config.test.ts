import { describe, expect, it, afterEach, vi } from "vitest";
import {
  encodeSupabaseConfigCookie,
  parseSupabaseConfigJson,
  resolveSupabaseConfigFromSources,
  validateSupabaseUrl,
} from "@/lib/supabase/config";

describe("supabase config helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips cookie JSON", () => {
    const encoded = encodeSupabaseConfigCookie({
      url: "https://example.supabase.co/",
      anonKey: "a".repeat(20),
    });
    const parsed = parseSupabaseConfigJson(encoded);
    expect(parsed).toEqual({
      url: "https://example.supabase.co",
      anonKey: "a".repeat(20),
    });
  });

  it("prefers cookie over env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://env.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "e".repeat(20));
    const config = resolveSupabaseConfigFromSources({
      cookieValue: encodeSupabaseConfigCookie({
        url: "https://cookie.supabase.co",
        anonKey: "c".repeat(20),
      }),
    });
    expect(config?.source).toBe("cookie");
    expect(config?.url).toBe("https://cookie.supabase.co");
  });

  it("falls back to env when cookie missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://env.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "e".repeat(20));
    const config = resolveSupabaseConfigFromSources({ cookieValue: null });
    expect(config?.source).toBe("env");
    expect(config?.url).toBe("https://env.supabase.co");
  });

  it("validates https supabase URLs", () => {
    expect(validateSupabaseUrl("https://abc.supabase.co")).toBe(true);
    expect(validateSupabaseUrl("http://evil.example")).toBe(false);
    expect(validateSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
  });
});
