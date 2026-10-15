import { NextResponse } from "next/server";
import { summarizeBilling } from "@/features/billing";
import { computeMonthlyForecast, inferLatestMonth } from "@/features/forecast";
import { withDataBackend } from "@/lib/api/backend-response";
import { billingFiltersSchema } from "@/schemas/filters";

export async function GET(request: Request) {
  return withDataBackend(async (backend) => {
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

    await backend.refreshInsights();

    const records = await backend.listBillingRecords();
    const summary = summarizeBilling(records, parsed.data);
    const currency =
      parsed.data.currency ??
      summary.totalsByCurrency[0]?.currency ??
      backend.user.preferredCurrency;
    const month = inferLatestMonth(records);
    const budgets = await backend.listBudgets();
    const globalBudget =
      budgets.find(
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

    const openAlerts = (await backend.listAlerts()).filter(
      (alert) => alert.status === "open",
    ).length;

    return NextResponse.json({
      summary,
      forecast,
      openAlerts,
      backend: backend.kind,
      user: {
        id: backend.user.id,
        preferredCurrency: backend.user.preferredCurrency,
      },
    });
  });
}
