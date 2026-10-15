import type { ReactNode } from "react";
import { AppSidebar, MobileNav } from "@/components/layout/app-nav";
import { DemoBanner } from "@/components/shared/demo-banner";
import { getAppMode } from "@/lib/data";
import { getServerSupabaseConfig } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function AppShell({ children }: { children: ReactNode }) {
  const mode = await getAppMode();
  const config = await getServerSupabaseConfig();
  let userLabel = "Demo session · CAD";

  if (mode.kind === "supabase") {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    userLabel = user?.email
      ? `${user.email} · live`
      : "Supabase · sign in required";
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <AppSidebar
          userLabel={userLabel}
          demoMode={mode.kind === "demo"}
          supabaseUrl={config?.url}
          anonKey={config?.anonKey}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav
            demoMode={mode.kind === "demo"}
            supabaseUrl={config?.url}
            anonKey={config?.anonKey}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
