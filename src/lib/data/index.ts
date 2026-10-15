import { createDemoBackend } from "@/lib/data/demo-backend";
import { createSupabaseBackend } from "@/lib/data/supabase-backend";
import type { DataBackend } from "@/lib/data/types";
import {
  createServerSupabaseClient,
  getServerSupabaseConfig,
} from "@/lib/supabase/server";

export type { DataBackend, DataBackendKind, SessionUser } from "@/lib/data/types";

export class AuthRequiredError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class BackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendError";
  }
}

export type AppMode = {
  kind: "demo" | "supabase";
  configSource: "env" | "cookie" | null;
  status: "demo" | "connected" | "missing_config" | "auth_error";
};

export async function getAppMode(): Promise<AppMode> {
  const config = await getServerSupabaseConfig();
  if (!config) {
    return { kind: "demo", configSource: null, status: "demo" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      kind: "demo",
      configSource: config.source,
      status: "missing_config",
    };
  }

  const { error } = await supabase.auth.getSession();
  if (error) {
    return {
      kind: "supabase",
      configSource: config.source,
      status: "auth_error",
    };
  }

  return {
    kind: "supabase",
    configSource: config.source,
    status: "connected",
  };
}

/**
 * Active data backend: Supabase (session + RLS) when configured, else demo store.
 * Throws AuthRequiredError when Supabase is configured but the user is not signed in.
 */
export async function getDataBackend(): Promise<DataBackend> {
  const config = await getServerSupabaseConfig();
  if (!config) {
    return createDemoBackend();
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return createDemoBackend();
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AuthRequiredError(error.message);
  }
  if (!user) {
    throw new AuthRequiredError();
  }

  return createSupabaseBackend(supabase, user);
}
