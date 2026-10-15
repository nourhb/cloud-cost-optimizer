import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SUPABASE_CONFIG_COOKIE,
  encodeSupabaseConfigCookie,
  validateSupabaseUrl,
} from "@/lib/supabase/config";
import {
  createServerSupabaseClient,
  getServerSupabaseConfig,
} from "@/lib/supabase/server";
import { cookies } from "next/headers";

const saveSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(20),
});

/** Reject service_role JWTs so they never land in browser-reachable config. */
function looksLikeServiceRoleKey(key: string): boolean {
  try {
    const payload = key.split(".")[1];
    if (!payload) {
      return key.includes("service_role");
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    return (
      json.includes('"role":"service_role"') ||
      json.includes('"role": "service_role"')
    );
  } catch {
    return key.includes("service_role");
  }
}

export async function GET() {
  const config = await getServerSupabaseConfig();
  if (!config) {
    return NextResponse.json({
      status: "missing_config" as const,
      demoMode: true,
      configured: false,
      source: null,
      message:
        "No Supabase project connected. The app is running in demo mode with an in-memory store.",
    });
  }

  const supabase = await createServerSupabaseClient();
  let authStatus: "ok" | "signed_out" | "error" = "signed_out";
  let authMessage: string | null = null;
  let userEmail: string | null = null;

  if (supabase) {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      authStatus = "error";
      authMessage = error.message;
    } else if (data.user) {
      authStatus = "ok";
      userEmail = data.user.email ?? null;
    }
  }

  return NextResponse.json({
    status:
      authStatus === "error"
        ? ("auth_error" as const)
        : ("connected" as const),
    demoMode: false,
    configured: true,
    source: config.source,
    url: config.url,
    anonKey: config.anonKey,
    authStatus,
    authMessage,
    userEmail,
    message:
      authStatus === "ok"
        ? "Connected to Supabase. Authenticated session active."
        : authStatus === "error"
          ? `Supabase configured but auth error: ${authMessage}`
          : "Supabase configured. Sign in to use your private data.",
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Provide a valid Supabase URL and anon (publishable) key.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  if (!validateSupabaseUrl(parsed.data.url)) {
    return NextResponse.json(
      {
        message:
          "Supabase URL must use https:// (or http://127.0.0.1 for local testing).",
      },
      { status: 400 },
    );
  }

  if (looksLikeServiceRoleKey(parsed.data.anonKey)) {
    return NextResponse.json(
      {
        message:
          "Use the anon/publishable key only — never the service_role key in this form.",
      },
      { status: 400 },
    );
  }

  const value = encodeSupabaseConfigCookie({
    url: parsed.data.url,
    anonKey: parsed.data.anonKey,
  });

  const cookieStore = await cookies();
  cookieStore.set(SUPABASE_CONFIG_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Probe Auth settings endpoint lightly via a client create + health-ish call
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const probe = createClient(
      parsed.data.url.trim().replace(/\/$/, ""),
      parsed.data.anonKey.trim(),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await probe.auth.getSession();
    if (error) {
      return NextResponse.json({
        ok: true,
        status: "auth_error" as const,
        message: `Saved connection, but Auth probe failed: ${error.message}. Check the URL/anon key and that Email auth is enabled.`,
      });
    }
  } catch (error) {
    return NextResponse.json({
      ok: true,
      status: "connected" as const,
      message: `Saved connection. Probe warning: ${error instanceof Error ? error.message : "unknown"}`,
    });
  }

  return NextResponse.json({
    ok: true,
    status: "connected" as const,
    message:
      "Supabase connection saved for this browser (httpOnly cookie). Production deploys should set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the host env instead.",
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SUPABASE_CONFIG_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({
    ok: true,
    message:
      "Cleared UI-saved Supabase connection. Env vars still apply if set. Otherwise the app returns to demo mode.",
  });
}
