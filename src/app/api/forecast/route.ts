import { NextResponse } from "next/server";
import { computeMonthlyForecast, inferLatestMonth } from "@/features/forecast";
import { withDataBackend } from "@/lib/api/backend-response";

export async function GET(request: Request) {
  return withDataBackend(async (backend) => {
    const url = new URL(request.url);
    const records = await backend.listBillingRecords();
    const currency =
      url.searchParams.get("currency") ??
      records[0]?.currency ??
      backend.user.preferredCurrency;
    const month =
      url.searchParams.get("month") ??
      inferLatestMonth(records) ??
      new Date().toISOString().slice(0, 7);

    const globalBudget =
      (await backend.listBudgets()).find(
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
  });
}
