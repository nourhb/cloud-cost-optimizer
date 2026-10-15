import { describe, expect, it } from "vitest";
import { mapBudget, mapImport, mapRecord } from "@/lib/supabase/mappers";

describe("supabase mappers", () => {
  it("maps billing import rows to domain", () => {
    const mapped = mapImport({
      id: "i1",
      user_id: "u1",
      filename: "a.csv",
      status: "committed",
      rows_processed: 2,
      rows_rejected: 0,
      rows_duplicated: 1,
      currency_mode: "single",
      primary_currency: "CAD",
      error_summary: null,
      preview_rows: null,
      created_at: "2026-10-01T00:00:00.000Z",
      committed_at: "2026-10-01T00:01:00.000Z",
    });
    expect(mapped.userId).toBe("u1");
    expect(mapped.rowsDuplicated).toBe(1);
    expect(mapped.primaryCurrency).toBe("CAD");
  });

  it("maps numeric decimals to strings", () => {
    const record = mapRecord({
      id: "r1",
      user_id: "u1",
      import_id: "i1",
      billing_date: "2026-10-01",
      provider: "AWS",
      service: "EC2",
      region: "ca-central-1",
      resource_id: "i-1",
      usage_quantity: 1.5,
      usage_unit: "hours",
      cost: 12.5,
      currency: "CAD",
      environment: "production",
      dedupe_key: "abc",
      created_at: "2026-10-01T00:00:00.000Z",
    });
    expect(record.cost).toBe("12.5");
    expect(record.usageQuantity).toBe("1.5");
  });

  it("maps budget thresholds", () => {
    const budget = mapBudget({
      id: "b1",
      user_id: "u1",
      name: "Monthly",
      amount: "100.00",
      currency: "CAD",
      period_start: "2026-10-01",
      period_end: "2026-10-31",
      scope_type: "global",
      scope_value: null,
      warning_threshold: "80",
      critical_threshold: "100",
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-01T00:00:00.000Z",
    });
    expect(budget.warningThreshold).toBe(80);
    expect(budget.criticalThreshold).toBe(100);
  });
});
