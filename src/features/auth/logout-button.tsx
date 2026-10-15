"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  demoMode: boolean;
  supabaseUrl?: string;
  anonKey?: string;
};

export function LogoutButton({ demoMode, supabaseUrl, anonKey }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onLogout() {
    startTransition(async () => {
      if (!demoMode && supabaseUrl && anonKey) {
        const supabase = createBrowserSupabaseClient(supabaseUrl, anonKey);
        await supabase.auth.signOut();
      }
      router.push(demoMode ? "/" : "/login");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={isPending}
      onClick={onLogout}
    >
      {isPending ? "Signing out…" : demoMode ? "Leave demo" : "Sign out"}
    </Button>
  );
}
