"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function SignupForm({ demoMode, supabaseUrl, anonKey }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "");

    startTransition(async () => {
      setError(null);
      setInfo(null);

      if (demoMode || !supabaseUrl || !anonKey) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient(supabaseUrl, anonKey);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || undefined },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setInfo(
          "Account created. If email confirmation is enabled in Supabase, check your inbox before signing in.",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-up failed.");
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
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
      {info ? (
        <div
          role="status"
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950"
        >
          {info}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Alex FinOps"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required={!demoMode}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={demoMode ? undefined : 6}
            required={!demoMode}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? "Creating account…"
            : demoMode
              ? "Continue to app (demo)"
              : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
