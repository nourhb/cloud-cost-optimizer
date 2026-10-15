import { z } from "zod";
import { configFromEnv, isEnvDemoMode } from "@/lib/supabase/config";

const envSchema = z
  .object({
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://127.0.0.1:43123"),
    NEXT_PUBLIC_DEMO_MODE: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    CSV_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),
    CSV_MAX_ROWS: z.coerce.number().int().positive().default(50_000),
  })
  .superRefine((data, ctx) => {
    // Soft validation: when demo is explicitly false, require env Supabase keys.
    // UI cookie config can also enable live mode without these env vars.
    if (data.NEXT_PUBLIC_DEMO_MODE) {
      return;
    }

    if (!data.NEXT_PUBLIC_SUPABASE_URL && !configFromEnv()) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
        message:
          "Required when NEXT_PUBLIC_DEMO_MODE=false (or save URL via Settings UI)",
      });
    }

    if (!data.NEXT_PUBLIC_SUPABASE_ANON_KEY && !configFromEnv()) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
        message:
          "Required when NEXT_PUBLIC_DEMO_MODE=false (or save anon key via Settings UI)",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

function readRawEnv() {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CSV_MAX_BYTES: process.env.CSV_MAX_BYTES,
    CSV_MAX_ROWS: process.env.CSV_MAX_ROWS,
  };
}

let cached: AppEnv | null = null;

/** Validate and return server-side env. Safe in demo mode without Supabase keys. */
export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(readRawEnv());
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  cached = parsed.data;
  return cached;
}

/**
 * Sync demo check (env + whether env Supabase keys exist).
 * Cookie-based live connections are detected via getAppMode() / getDataBackend().
 */
export function isDemoMode(): boolean {
  return isEnvDemoMode();
}
