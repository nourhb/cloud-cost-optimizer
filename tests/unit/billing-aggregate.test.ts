import { describe, expect, it } from "vitest";
import { summarizeBilling } from "@/features/billing";
import type { BillingRecord } from "@/types/domain";

function record(
  partial: Partial<BillingRecord> &
    Pick<BillingRecord, "billingDate" | "service" | "cost" | "currency">,
): BillingRecord {
  return {
    id: partial.id ?? "id",
    userId: "user",
    importId: "import",
    billingDate: partial.billingDate,
    provider: partial.provider ?? "aws",
    service: partial.service,
    region: partial.region ?? "us-east-1",
    resourceId: partial.resourceId ?? "r1",
    usageQuantity: "1",
    usageUnit: "Hrs",
    cost: partial.cost,
    currency: partial.currency,
    environment: partial.environment ?? "prod",
    dedupeKey: partial.dedupeKey ?? "k",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("summarizeBilling", () => {
  it("aggregates totals and respects filters", () => {
    const records = [
      record({
        billingDate: "2026-01-02",
        service: "AmazonEC2",
        cost: "10",
        currency: "CAD",
        region: "us-east-1",
      }),
      record({
        billingDate: "2026-01-03",
        service: "AmazonS3",
        cost: "5",
        currency: "CAD",
        region: "ca-central-1",
      }),
      record({
        billingDate: "2026-02-01",
        service: "AmazonEC2",
        cost: "20",
        currency: "CAD",
        region: "us-east-1",
      }),
    ];

    const all = summarizeBilling(records);
    expect(all.recordCount).toBe(3);
    expect(all.totalsByCurrency[0]).toMatchObject({
      currency: "CAD",
      amount: "35.000000",
    });
    expect(all.topServices[0].name).toBe("AmazonEC2");

    const filtered = summarizeBilling(records, { region: "ca-central-1" });
    expect(filtered.recordCount).toBe(1);
    expect(filtered.totalsByCurrency[0].amount).toBe("5.000000");
  });

  it("does not sum different currencies together", () => {
    const summary = summarizeBilling([
      record({
        billingDate: "2026-01-02",
        service: "AmazonEC2",
        cost: "10",
        currency: "CAD",
      }),
      record({
        billingDate: "2026-01-02",
        service: "AmazonEC2",
        cost: "8",
        currency: "USD",
      }),
    ]);
    expect(summary.totalsByCurrency).toHaveLength(2);
  });
});
