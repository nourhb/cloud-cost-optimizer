import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "@/lib/env";

export function DemoBanner() {
  if (!isDemoMode()) {
    return null;
  }

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
          Running without Supabase. Data is in-memory fixtures only — no cloud
          credentials required.
        </span>
      </div>
    </div>
  );
}
