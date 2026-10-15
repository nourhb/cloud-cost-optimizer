import { describe, expect, it } from "vitest";
import { computeMonthlyForecast } from "@/features/forecast";
import type { BillingRecord, Budget } from "@/types/domain";

function record(date: string, cost: string): BillingRecord {
  return {
    id: date,
    userId: "u",
    importId: "i",
    billingDate: date,
    provider: "aws",
    service: "AmazonEC2",
    region: "us-east-1",
    resourceId: "r",
    usageQuantity: "1",
    usageUnit: "Hrs",
    cost,
    currency: "CAD",
    environment: "prod",
    dedupeKey: date,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("computeMonthlyForecast", () => {
  it("hides forecast when fewer than 3 distinct days (confidence none)", () => {
    const result = computeMonthlyForecast({
      records: [record("2026-01-01", "10"), record("2026-01-02", "10")],
      currency: "CAD",
      month: "2026-01",
      asOfDate: "2026-01-02",
    });
    expect(result.confidence).toBe("none");
    expect(result.forecastMonthEnd).toBeNull();
  });

  it("applies CDC linear formula with low/medium confidence", () => {
    const records = Array.from({ length: 10 }, (_, index) =>
      record(`2026-01-${String(index + 1).padStart(2, "0")}`, "10"),
    );
    const result = computeMonthlyForecast({
      records,
      currency: "CAD",
      month: "2026-01",
      asOfDate: "2026-01-10",
    });
    expect(result.confidence).toBe("medium");
    expect(result.daysInMonth).toBe(31);
    expect(result.observedSpend).toBe("100.000000");
    // (100 / 10) * 31 = 310
    expect(result.forecastMonthEnd).toBe("310.000000");
    expect(result.confidence).not.toBe("high" as never);
  });

  it("reports budget gap when a budget is provided", () => {
    const budget: Budget = {
      id: "b1",
      userId: "u",
      name: "Jan",
      amount: "200",
      currency: "CAD",
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
      scopeType: "global",
      scopeValue: null,
      warningThreshold: 80,
      criticalThreshold: 100,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const records = Array.from({ length: 5 }, (_, index) =>
      record(`2026-01-${String(index + 1).padStart(2, "0")}`, "20"),
    );
    const result = computeMonthlyForecast({
      records,
      currency: "CAD",
      month: "2026-01",
      asOfDate: "2026-01-05",
      budget,
    });
    expect(result.confidence).toBe("low");
    // (100 / 5) * 31 = 620; gap = 620 - 200 = 420
    expect(result.budgetGap).toBe("420.000000");
  });
});
