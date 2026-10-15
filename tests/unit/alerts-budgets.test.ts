import { describe, expect, it } from "vitest";
import { evaluateAlerts } from "@/features/alerts";
import { evaluateBudgetSpend } from "@/features/budgets";
import { evaluateRecommendations } from "@/features/recommendations";
import type { BillingRecord, Budget } from "@/types/domain";

function record(
  partial: Partial<BillingRecord> &
    Pick<BillingRecord, "billingDate" | "service" | "cost">,
): BillingRecord {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    userId: "u",
    importId: "i",
    billingDate: partial.billingDate,
    provider: partial.provider ?? "aws",
    service: partial.service,
    region: partial.region ?? "us-east-1",
    resourceId: partial.resourceId ?? "r",
    usageQuantity: "1",
    usageUnit: "Hrs",
    cost: partial.cost,
    currency: partial.currency ?? "CAD",
    environment: partial.environment ?? "prod",
    dedupeKey: partial.dedupeKey ?? Math.random().toString(36),
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const budget: Budget = {
  id: "budget-1",
  userId: "u",
  name: "Tight monthly",
  amount: "50",
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

describe("budgets + alerts + recommendations", () => {
  it("marks budget critical when spend exceeds critical threshold", () => {
    const records = [
      record({ billingDate: "2026-01-02", service: "AmazonEC2", cost: "60" }),
    ];
    const spend = evaluateBudgetSpend(budget, records);
    expect(spend.status).toBe("critical");
    expect(spend.utilizationPercent).toBeGreaterThanOrEqual(100);

    const alerts = evaluateAlerts({ records, budgets: [budget] });
    expect(alerts.some((alert) => alert.type === "budget_critical")).toBe(true);
  });

  it("emits concentration recommendation when one service dominates", () => {
    const records = [
      record({ billingDate: "2026-01-01", service: "AmazonEC2", cost: "80" }),
      record({ billingDate: "2026-01-02", service: "AmazonS3", cost: "10" }),
      record({ billingDate: "2026-01-03", service: "AmazonEC2", cost: "10" }),
    ];
    const recs = evaluateRecommendations({ records, budgets: [] });
    expect(recs.some((item) => item.category === "concentration")).toBe(true);
    expect(
      recs.every((item) =>
        item.proposedAction.toLowerCase().includes("advisory") ||
        item.limitations.length > 0,
      ),
    ).toBe(true);
  });

  it("flags insufficient data when no records exist", () => {
    const alerts = evaluateAlerts({ records: [], budgets: [] });
    expect(alerts[0]?.type).toBe("insufficient_data");
  });
});
