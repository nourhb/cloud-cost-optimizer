import { SignupForm } from "@/features/auth";
import { getServerSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Sign up" };

export default async function SignupPage() {
  const config = await getServerSupabaseConfig();
  const demoMode = !config;

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f3f0_0%,_#f7faf9_55%,_#eef2f7_100%)] px-4 py-12">
      <SignupForm
        demoMode={demoMode}
        supabaseUrl={config?.url}
        anonKey={config?.anonKey}
      />
    </div>
  );
}
