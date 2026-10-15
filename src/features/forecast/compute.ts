import type { BillingRecord, Budget, ForecastResult } from "@/types/domain";

function daysInMonthUtc(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function parseMonth(month: string): { year: number; monthIndex0: number } {
  const [y, m] = month.split("-").map(Number);
  return { year: y, monthIndex0: m - 1 };
}

/**
 * CDC §4.7 linear forecast:
 * forecast = (cumulativeSpend / daysElapsed) × daysInMonth
 *
 * Confidence (architecture §6.1):
 * - none: < 3 distinct days with data in the month
 * - low: 3–9 days
 * - medium: ≥ 10 days
 * - never high
 */
export function computeMonthlyForecast(input: {
  records: BillingRecord[];
  currency: string;
  month: string; // YYYY-MM
  asOfDate?: string; // YYYY-MM-DD, defaults to last day with data or today
  budget?: Budget | null;
}): ForecastResult {
  const { year, monthIndex0 } = parseMonth(input.month);
  const daysInMonth = daysInMonthUtc(year, monthIndex0);
  const monthPrefix = input.month;

  const monthRecords = input.records.filter(
    (record) =>
      record.currency === input.currency &&
      record.billingDate.startsWith(monthPrefix),
  );

  const distinctDays = new Set(monthRecords.map((row) => row.billingDate));
  const distinctDaysWithData = distinctDays.size;

  const lastDataDay =
    monthRecords.length > 0
      ? [...distinctDays].sort().at(-1)!
      : `${monthPrefix}-01`;

  const asOf = input.asOfDate ?? lastDataDay;
  const asOfDay = Math.min(
    daysInMonth,
    Math.max(1, Number(asOf.slice(8, 10)) || 1),
  );

  // Days elapsed = calendar day of as-of within the month (CDC formula).
  const daysElapsed = asOfDay;

  const observedSpend = monthRecords
    .filter((row) => row.billingDate <= asOf)
    .reduce((sum, row) => sum + Number(row.cost), 0);

  let confidence: ForecastResult["confidence"] = "none";
  if (distinctDaysWithData >= 10) {
    confidence = "medium";
  } else if (distinctDaysWithData >= 3) {
    confidence = "low";
  }

  let forecastMonthEnd: string | null = null;
  if (confidence !== "none" && daysElapsed > 0) {
    const value = (observedSpend / daysElapsed) * daysInMonth;
    forecastMonthEnd = value.toFixed(6);
  }

  const budgetAmount = input.budget?.amount ?? null;
  let budgetGap: string | null = null;
  if (forecastMonthEnd !== null && budgetAmount !== null) {
    budgetGap = (Number(forecastMonthEnd) - Number(budgetAmount)).toFixed(6);
  }

  const limitations =
    confidence === "none"
      ? "Fewer than 3 days of data in this month — forecast hidden (insufficient data)."
      : "Linear daily-rate extrapolation assumes spend stays roughly stable. Never treated as high confidence in MVP.";

  return {
    currency: input.currency,
    observedSpend: observedSpend.toFixed(6),
    daysElapsed,
    daysInMonth,
    distinctDaysWithData,
    forecastMonthEnd,
    confidence,
    limitations,
    month: input.month,
    budgetAmount,
    budgetGap,
  };
}

export function inferLatestMonth(records: BillingRecord[]): string | null {
  if (records.length === 0) {
    return null;
  }
  const latest = records.reduce(
    (max, row) => (row.billingDate > max ? row.billingDate : max),
    records[0].billingDate,
  );
  return latest.slice(0, 7);
}
