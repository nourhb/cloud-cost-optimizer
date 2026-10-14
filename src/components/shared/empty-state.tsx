import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10",
        className,
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
