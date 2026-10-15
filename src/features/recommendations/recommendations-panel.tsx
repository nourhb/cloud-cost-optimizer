"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { Recommendation } from "@/types/domain";

export function RecommendationsPanel() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const response = await fetch("/api/recommendations?refresh=1");
      const data = (await response.json()) as {
        recommendations?: Recommendation[];
        message?: string;
      };
      if (!response.ok) {
        setError(data.message ?? "Could not load recommendations.");
        return;
      }
      setItems(data.recommendations ?? []);
      setError(null);
    });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Explainable recommendations</CardTitle>
          <CardDescription>
            Rule-based and advisory only — Cloud Cost Optimizer never changes
            cloud resources.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={load}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recommendations yet. Import multi-service billing data to surface
            concentration, growth, environment skew, or budget risk.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border px-3 py-3"
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <p className="mt-2 font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-medium">Proposed action:</span>{" "}
                {item.proposedAction}
              </p>
              {item.estimatedSavings && item.estimatedSavingsCurrency ? (
                <p className="mt-1 text-sm">
                  <span className="font-medium">Estimated overage:</span>{" "}
                  {formatMoney({
                    amount: item.estimatedSavings,
                    currency: item.estimatedSavingsCurrency,
                  })}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Limitations: {item.limitations}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
