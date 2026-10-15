import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAppMode } from "@/lib/data";
import { cn } from "@/lib/utils";

export async function DemoBanner() {
  const mode = await getAppMode();

  if (mode.kind === "demo") {
    return (
      <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm text-amber-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-950 hover:bg-amber-100"
          >
            Demo mode
          </Badge>
          <span>
            Running without Supabase. Data is in-memory only — connect a project
            under Settings for live Auth and Postgres.
          </span>
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto px-0 text-amber-950",
            )}
          >
            Connect Supabase
          </Link>
        </div>
      </div>
    );
  }

  if (mode.status === "auth_error") {
    return (
      <div className="border-b border-red-200/80 bg-red-50 px-4 py-2 text-sm text-red-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <Badge className="bg-red-100 text-red-950 hover:bg-red-100">
            Auth error
          </Badge>
          <span>
            Supabase is configured but the session could not be verified. Sign
            in again or check your project keys.
          </span>
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto px-0 text-red-950",
            )}
          >
            Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-teal-200/80 bg-teal-50 px-4 py-2 text-sm text-teal-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <Badge className="bg-teal-100 text-teal-950 hover:bg-teal-100">
          Live Supabase
        </Badge>
        <span>
          Connected to Postgres + Auth
          {mode.configSource ? ` (via ${mode.configSource})` : ""}. Data is
          protected by Row Level Security.
        </span>
      </div>
    </div>
  );
}
