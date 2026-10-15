import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_CONFIG_COOKIE,
  resolveSupabaseConfigFromSources,
} from "@/lib/supabase/config";

/** App pages that require Auth when Supabase is connected. /settings stays public for onboarding. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/imports",
  "/analysis",
  "/budgets",
  "/alerts",
  "/recommendations",
  "/reports",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedApi(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) {
    return false;
  }
  if (pathname === "/api/health" || pathname.startsWith("/api/connection")) {
    return false;
  }
  if (pathname.startsWith("/api/demo/")) {
    return false;
  }
  return true;
}

/** Refresh Supabase auth cookies and gate protected routes when live. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = resolveSupabaseConfigFromSources({
    cookieValue: request.cookies.get(SUPABASE_CONFIG_COOKIE)?.value,
  });

  // Demo mode: no Supabase — allow app routes (existing stub session path).
  if (!config) {
    return response;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && (isProtectedPath(pathname) || isProtectedApi(pathname))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Authentication required. Sign in to continue." },
        { status: 401 },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === "/login" || pathname === "/signup")
  ) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    return NextResponse.redirect(dashboard);
  }

  return response;
}
