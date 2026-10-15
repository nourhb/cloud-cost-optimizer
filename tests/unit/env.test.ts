import { afterEach, describe, expect, it, vi } from "vitest";

describe("isDemoMode", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("defaults to demo when unset and no Supabase env", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
    const { isDemoMode } = await import("@/lib/env");
    expect(isDemoMode()).toBe(true);
  });

  it("reads true from env when Supabase env missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
    const { isDemoMode } = await import("@/lib/env");
    expect(isDemoMode()).toBe(true);
  });

  it("is not demo when Supabase env is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "a".repeat(20));
    const { isDemoMode } = await import("@/lib/env");
    expect(isDemoMode()).toBe(false);
  });
});
