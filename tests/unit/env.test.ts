import { afterEach, describe, expect, it, vi } from "vitest";

describe("isDemoMode", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("defaults to demo when unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", undefined);
    const { isDemoMode } = await import("@/lib/env");
    expect(isDemoMode()).toBe(true);
  });

  it("reads true from env", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    const { isDemoMode } = await import("@/lib/env");
    expect(isDemoMode()).toBe(true);
  });
});
