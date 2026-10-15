"use client";

import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConnectionResponse = {
  status: "connected" | "missing_config" | "auth_error";
  demoMode: boolean;
  configured: boolean;
  source: "env" | "cookie" | null;
  url?: string;
  message?: string;
  authStatus?: string;
  userEmail?: string | null;
  authMessage?: string | null;
};

export type MigrationResponse = {
  combined: string;
  rlsNote: string;
  migrations: { filename: string; sql: string }[];
};

function statusBadge(status: ConnectionResponse["status"], demoMode: boolean) {
  if (demoMode || status === "missing_config") {
    return <Badge variant="secondary">Missing config · Demo mode</Badge>;
  }
  if (status === "auth_error") {
    return (
      <Badge className="bg-red-100 text-red-950 hover:bg-red-100">
        Auth error
      </Badge>
    );
  }
  return (
    <Badge className="bg-teal-100 text-teal-950 hover:bg-teal-100">
      Connected
    </Badge>
  );
}

type Props = {
  initialConnection: ConnectionResponse;
  initialMigrations: MigrationResponse;
};

export function ConnectionPanel({
  initialConnection,
  initialMigrations,
}: Props) {
  const [connection, setConnection] =
    useState<ConnectionResponse>(initialConnection);
  const [migrations] = useState<MigrationResponse>(initialMigrations);
  const [url, setUrl] = useState(initialConnection.url ?? "");
  const [anonKey, setAnonKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const response = await fetch("/api/connection");
    const conn = (await response.json()) as ConnectionResponse;
    setConnection(conn);
    if (conn.url) {
      setUrl(conn.url);
    }
  }

  function onSave() {
    startTransition(async () => {
      setError(null);
      setInfo(null);
      try {
        const response = await fetch("/api/connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, anonKey }),
        });
        const data = (await response.json()) as {
          message?: string;
          ok?: boolean;
        };
        if (!response.ok) {
          setError(data.message ?? "Could not save connection.");
          return;
        }
        setInfo(data.message ?? "Connection saved.");
        setAnonKey("");
        await refresh();
      } catch {
        setError("Network error while saving connection.");
      }
    });
  }

  function onDisconnect() {
    startTransition(async () => {
      setError(null);
      setInfo(null);
      try {
        const response = await fetch("/api/connection", { method: "DELETE" });
        const data = (await response.json()) as { message?: string };
        setInfo(data.message ?? "Disconnected.");
        await refresh();
      } catch {
        setError("Network error while clearing connection.");
      }
    });
  }

  async function copySql() {
    if (!migrations.combined) {
      return;
    }
    try {
      await navigator.clipboard.writeText(migrations.combined);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy SQL. Select the text manually below.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Supabase connection</CardTitle>
            {statusBadge(connection.status, connection.demoMode)}
          </div>
          <CardDescription>
            Paste your free-tier project URL and anon key. Never paste the
            service_role key here — it bypasses RLS and must stay server-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {connection.message}
            {connection.source ? ` · Source: ${connection.source}` : null}
            {connection.userEmail
              ? ` · Signed in as ${connection.userEmail}`
              : null}
          </p>

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

          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              name="supabaseUrl"
              type="url"
              placeholder="https://xxxx.supabase.co"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anonKey">Anon (publishable) key</Label>
            <Input
              id="anonKey"
              name="anonKey"
              type="password"
              placeholder="eyJhbGciOi…"
              value={anonKey}
              onChange={(event) => setAnonKey(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={isPending || !url || !anonKey}
            >
              {isPending ? "Saving…" : "Save connection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDisconnect}
              disabled={isPending}
            >
              Clear UI connection
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Local/dev: saved in an httpOnly cookie for this browser. Production:
            prefer{" "}
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            in the host environment. When neither is set, the app stays in demo
            mode.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply SQL migrations</CardTitle>
          <CardDescription>
            Open the Supabase SQL Editor, paste the combined migration, and run
            it. This creates tables, indexes, RLS policies, and the profile
            trigger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{migrations.rlsNote}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copySql()}>
              {copied ? "Copied" : "Copy SQL"}
            </Button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Open Supabase dashboard
            </a>
          </div>
          <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
            {migrations.combined}
          </pre>
          <ul className="list-inside list-disc text-xs text-muted-foreground">
            {migrations.migrations.map((item) => (
              <li key={item.filename}>{item.filename}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
