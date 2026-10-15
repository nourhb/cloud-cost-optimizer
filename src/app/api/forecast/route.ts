import { NextResponse } from "next/server";
import { computeMonthlyForecast, inferLatestMonth } from "@/features/forecast";
import {
  demoUser,
  listDemoBillingRecords,
  listDemoBudgets,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";

export function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Forecast with Supabase is not wired yet." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const records = listDemoBillingRecords(demoUser.id);
  const currency =
    url.searchParams.get("currency") ??
    records[0]?.currency ??
    demoUser.preferredCurrency;
  const month =
    url.searchParams.get("month") ??
    inferLatestMonth(records) ??
    new Date().toISOString().slice(0, 7);

  const globalBudget =
    listDemoBudgets(demoUser.id).find(
      (budget) =>
        budget.currency === currency &&
        budget.scopeType === "global" &&
        budget.periodStart.slice(0, 7) <= month &&
        budget.periodEnd.slice(0, 7) >= month,
    ) ?? null;

  const forecast = computeMonthlyForecast({
    records,
    currency,
    month,
    budget: globalBudget,
  });

  return NextResponse.json({ forecast });
}
