import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PageHeader } from "@/components/layout/page-header";
import { ConnectionPanel } from "@/features/settings/connection-panel";
import {
  createServerSupabaseClient,
  getServerSupabaseConfig,
} from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

async function loadConnectionStatus() {
  const config = await getServerSupabaseConfig();
  if (!config) {
    return {
      status: "missing_config" as const,
      demoMode: true,
      configured: false,
      source: null,
      message:
        "No Supabase project connected. The app is running in demo mode with an in-memory store.",
    };
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

  return {
    status:
      authStatus === "error"
        ? ("auth_error" as const)
        : ("connected" as const),
    demoMode: false,
    configured: true,
    source: config.source,
    url: config.url,
    authStatus,
    authMessage,
    userEmail,
    message:
      authStatus === "ok"
        ? "Connected to Supabase. Authenticated session active."
        : authStatus === "error"
          ? `Supabase configured but auth error: ${authMessage}`
          : "Supabase configured. Sign in to use your private data.",
  };
}

async function loadMigrations() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const migrations = await Promise.all(
    files.map(async (filename) => {
      const sql = await readFile(path.join(migrationsDir, filename), "utf8");
      return { filename, sql };
    }),
  );

  const combined = migrations
    .map((item) => `-- >>> ${item.filename}\n${item.sql.trim()}\n`)
    .join("\n");

  return {
    migrations,
    combined,
    rlsNote:
      "RLS policies restrict every row with user_id = auth.uid() (profiles use id = auth.uid()). Apply 00002_rls.sql after tables exist. Never expose the service_role key to the browser.",
  };
}

export default async function SettingsPage() {
  const [initialConnection, initialMigrations] = await Promise.all([
    loadConnectionStatus(),
    loadMigrations(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Connect a free Supabase project for real Auth and Postgres, or stay in demo mode with the in-memory store."
      />
      <ConnectionPanel
        initialConnection={initialConnection}
        initialMigrations={initialMigrations}
      />
    </div>
  );
}
