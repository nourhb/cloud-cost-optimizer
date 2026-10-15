import { Suspense } from "react";
import { LoginForm } from "@/features/auth";
import { getServerSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const config = await getServerSupabaseConfig();
  const demoMode = !config;

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f3f0_0%,_#f7faf9_55%,_#eef2f7_100%)] px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm
          demoMode={demoMode}
          supabaseUrl={config?.url}
          anonKey={config?.anonKey}
        />
      </Suspense>
    </div>
  );
}
