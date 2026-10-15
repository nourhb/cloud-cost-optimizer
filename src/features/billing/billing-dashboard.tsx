"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { BreakdownBarChart } from "@/components/charts/breakdown-bar-chart";
import { CostTrendChart } from "@/components/charts/cost-trend-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BillingSummary } from "@/features/billing";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ForecastResult } from "@/types/domain";

type Filters = {
  from: string;
  to: string;
  provider: string;
  service: string;
  region: string;
  environment: string;
  currency: string;
};

const emptyFilters: Filters = {
  from: "",
  to: "",
  provider: "",
  service: "",
  region: "",
  environment: "",
  currency: "",
};

export function BillingDashboard({
  title = "Dashboard",
  showTopServices = true,
}: {
  title?: string;
  showTopServices?: boolean;
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [openAlerts, setOpenAlerts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const query = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params.set(key, value);
      }
    }
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(
          `/api/billing/summary${query ? `?${query}` : ""}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          summary?: BillingSummary;
          forecast?: ForecastResult | null;
          openAlerts?: number;
          message?: string;
        };
        if (!response.ok) {
          setError(data.message ?? "Could not load billing summary.");
          return;
        }
        setSummary(data.summary ?? null);
        setForecast(data.forecast ?? null);
        setOpenAlerts(data.openAlerts ?? 0);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError("Network error while loading billing data.");
      }
    });
    return () => controller.abort();
  }, [query]);

  if (!isPending && summary && summary.recordCount === 0 && !hasActiveFilters(filters)) {
    return (
      <EmptyState
        title="No billing data yet"
        description="Import a valid billing CSV to populate KPIs and charts."
        action={
          <Link
            href="/imports/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Import a CSV
          </Link>
        }
      />
    );
  }

  const options = summary?.filterOptions;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow spend by period, provider, service, region, environment, or
            currency. Totals stay separated by currency (no FX conversion).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FilterField label="From" htmlFor={`${title}-from`}>
            <Input
              id={`${title}-from`}
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, from: event.target.value }))
              }
            />
          </FilterField>
          <FilterField label="To" htmlFor={`${title}-to`}>
            <Input
              id={`${title}-to`}
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, to: event.target.value }))
              }
            />
          </FilterField>
          <SelectFilter
            label="Provider"
            value={filters.provider}
            options={options?.providers ?? []}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, provider: value }))
            }
          />
          <SelectFilter
            label="Service"
            value={filters.service}
            options={options?.services ?? []}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, service: value }))
            }
          />
          <SelectFilter
            label="Region"
            value={filters.region}
            options={options?.regions ?? []}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, region: value }))
            }
          />
          <SelectFilter
            label="Environment"
            value={filters.environment}
            options={options?.environments ?? []}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, environment: value }))
            }
          />
          <SelectFilter
            label="Currency"
            value={filters.currency}
            options={options?.currencies ?? []}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, currency: value }))
            }
          />
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {isPending && !summary ? (
        <p className="text-sm text-muted-foreground">Loading spend summary…</p>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Kpi
              label="Rows in view"
              value={String(summary.recordCount)}
              hint={isPending ? "Refreshing…" : "After filters"}
            />
            <Kpi
              label="Total cost"
              value={formatTotals(summary.totalsByCurrency)}
              hint="All currencies listed separately"
            />
            <Kpi
              label="Current month"
              value={formatTotals(summary.currentMonthByCurrency)}
              hint="Based on latest month in view"
            />
            <Kpi
              label="vs previous month"
              value={formatDelta(summary.previousPeriodDelta)}
              hint="Same currency only"
            />
            <Kpi
              label="Month-end forecast"
              value={
                forecast?.forecastMonthEnd
                  ? formatMoney({
                      amount: forecast.forecastMonthEnd,
                      currency: forecast.currency,
                    })
                  : "Hidden"
              }
              hint={
                forecast
                  ? `Confidence: ${forecast.confidence}`
                  : "Import data to forecast"
              }
            />
            <Kpi
              label="Open alerts"
              value={String(openAlerts)}
              hint="Recomputed on refresh"
            />
          </div>

          {forecast ? (
            <Card>
              <CardHeader>
                <CardTitle>Forecast details ({forecast.month})</CardTitle>
                <CardDescription>{forecast.limitations}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  Observed:{" "}
                  {formatMoney({
                    amount: forecast.observedSpend,
                    currency: forecast.currency,
                  })}
                </p>
                <p>
                  Days elapsed / in month: {forecast.daysElapsed} /{" "}
                  {forecast.daysInMonth}
                </p>
                <p>Distinct days with data: {forecast.distinctDaysWithData}</p>
                <p>
                  Budget gap:{" "}
                  {forecast.budgetGap === null
                    ? "No matching global budget"
                    : formatMoney({
                        amount: forecast.budgetGap,
                        currency: forecast.currency,
                      })}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily cost trend</CardTitle>
                <CardDescription>Spend over the filtered period</CardDescription>
              </CardHeader>
              <CardContent>
                <CostTrendChart data={summary.dailyTrend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By service</CardTitle>
                <CardDescription>Top services in the current filters</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBarChart data={summary.byService} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By region</CardTitle>
                <CardDescription>Regional spend comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBarChart data={summary.byRegion} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By environment</CardTitle>
                <CardDescription>prod / staging / dev skew</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBarChart data={summary.byEnvironment} />
              </CardContent>
            </Card>
          </div>

          {showTopServices ? (
            <Card>
              <CardHeader>
                <CardTitle>Top services</CardTitle>
                <CardDescription>Highest spend in the current filter set</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {summary.topServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No services match these filters.
                  </p>
                ) : (
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="px-2 py-2 font-medium">Service</th>
                        <th className="px-2 py-2 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.topServices.map((row) => (
                        <tr key={`${row.name}-${row.currency}`} className="border-b last:border-0">
                          <td className="px-2 py-2">{row.name}</td>
                          <td className="px-2 py-2">
                            {formatMoney({
                              amount: row.amount.toFixed(2),
                              currency: row.currency,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function hasActiveFilters(filters: Filters): boolean {
  return Object.values(filters).some(Boolean);
}

function formatTotals(
  totals: Array<{ currency: string; amount: string }>,
): string {
  if (totals.length === 0) {
    return "—";
  }
  return totals
    .map((row) => formatMoney({ amount: row.amount, currency: row.currency }))
    .join(" · ");
}

function formatDelta(
  deltas: Array<{
    currency: string;
    current: number;
    previous: number;
    percentChange: number | null;
  }>,
): string {
  if (deltas.length === 0) {
    return "—";
  }
  return deltas
    .map((row) => {
      if (row.percentChange === null) {
        return `${row.currency}: n/a`;
      }
      const sign = row.percentChange > 0 ? "+" : "";
      return `${row.currency}: ${sign}${row.percentChange.toFixed(1)}%`;
    })
    .join(" · ");
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
