"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthModeCopy } from "@/features/auth/copy";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  demoMode: boolean;
  supabaseUrl?: string;
  anonKey?: string;
};

export function LoginForm({ demoMode, supabaseUrl, anonKey }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    startTransition(async () => {
      setError(null);

      if (demoMode || !supabaseUrl || !anonKey) {
        router.push(next);
        router.refresh();
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient(supabaseUrl, anonKey);
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push(next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      }
    });
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-background/90 p-8 shadow-sm">
      <div className="space-y-1">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Cloud Cost Optimizer
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          {getAuthModeCopy(demoMode)}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
        >
          {error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            defaultValue={demoMode ? "demo@example.com" : ""}
            required={!demoMode}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            defaultValue={demoMode ? "demo-password" : ""}
            required={!demoMode}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? "Signing in…"
            : demoMode
              ? "Continue to app (demo)"
              : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {demoMode ? (
          <>
            Want real Auth?{" "}
            <Link
              href="/settings"
              className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
            >
              Connect Supabase
            </Link>
          </>
        ) : (
          <>
            No account?{" "}
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
