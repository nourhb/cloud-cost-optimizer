import { NextResponse } from "next/server";
import { summarizeBilling } from "@/features/billing";
import { computeMonthlyForecast, inferLatestMonth } from "@/features/forecast";
import {
  demoUser,
  listDemoAlerts,
  listDemoBillingRecords,
  listDemoBudgets,
  refreshDemoInsights,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { billingFiltersSchema } from "@/schemas/filters";

export function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Billing summary with Supabase is not wired yet." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const raw = {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    provider: url.searchParams.get("provider") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    region: url.searchParams.get("region") ?? undefined,
    environment: url.searchParams.get("environment") ?? undefined,
    currency: url.searchParams.get("currency") ?? undefined,
  };

  const parsed = billingFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid filters.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  // CDC §4.6 — recompute alerts on dashboard refresh.
  refreshDemoInsights(demoUser.id);

  const records = listDemoBillingRecords(demoUser.id);
  const summary = summarizeBilling(records, parsed.data);
  const currency =
    parsed.data.currency ??
    summary.totalsByCurrency[0]?.currency ??
    demoUser.preferredCurrency;
  const month = inferLatestMonth(records);
  const globalBudget =
    listDemoBudgets(demoUser.id).find(
      (budget) =>
        budget.scopeType === "global" &&
        budget.currency === currency &&
        (!month ||
          (budget.periodStart.slice(0, 7) <= month &&
            budget.periodEnd.slice(0, 7) >= month)),
    ) ?? null;
  const forecast = month
    ? computeMonthlyForecast({
        records,
        currency,
        month,
        budget: globalBudget,
      })
    : null;

  const openAlerts = listDemoAlerts(demoUser.id).filter(
    (alert) => alert.status === "open",
  ).length;

  return NextResponse.json({
    summary,
    forecast,
    openAlerts,
    user: {
      id: demoUser.id,
      preferredCurrency: demoUser.preferredCurrency,
    },
  });
}
