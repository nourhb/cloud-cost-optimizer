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
import type { Alert } from "@/types/domain";

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load(refresh = true) {
    startTransition(async () => {
      const response = await fetch(
        `/api/alerts${refresh ? "?refresh=1" : ""}`,
      );
      const data = (await response.json()) as {
        alerts?: Alert[];
        message?: string;
      };
      if (!response.ok) {
        setError(data.message ?? "Could not load alerts.");
        return;
      }
      setAlerts(data.alerts ?? []);
      setError(null);
    });
  }

  useEffect(() => {
    load(true);
  }, []);

  function acknowledge(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge" }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Could not acknowledge alert.");
        return;
      }
      load(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Detected alerts</CardTitle>
          <CardDescription>
            Evaluated on import commit and when this page refreshes. Includes
            budget thresholds, daily spikes, and service surges.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => load(true)}
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
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No alerts. Import billing data and optionally create a tight budget
            to trigger thresholds.
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-border px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    alert.severity === "critical"
                      ? "destructive"
                      : alert.severity === "warning"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {alert.severity}
                </Badge>
                <Badge variant="outline">{alert.status}</Badge>
                <span className="text-xs text-muted-foreground">{alert.type}</span>
              </div>
              <p className="mt-2 font-medium">{alert.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {alert.description}
              </p>
              {alert.recommendedAction ? (
                <p className="mt-2 text-sm">
                  <span className="font-medium">Recommended action:</span>{" "}
                  {alert.recommendedAction}
                </p>
              ) : null}
              {alert.status === "open" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => acknowledge(alert.id)}
                >
                  Acknowledge
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
