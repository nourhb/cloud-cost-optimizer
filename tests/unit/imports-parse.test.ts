import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDedupeKey,
  normalizeDecimal,
  parseBillingCsv,
} from "@/features/imports";
import {
  commitDemoImport,
  createDemoImportPreview,
  listDemoBillingRecords,
  resetDemoStore,
} from "@/lib/demo/store";

const samplesDir = path.resolve(__dirname, "../../data/samples");

function loadSample(name: string): string {
  return readFileSync(path.join(samplesDir, name), "utf8");
}

const limits = { maxBytes: 5_242_880, maxRows: 50_000 };

describe("parseBillingCsv", () => {
  it("accepts the valid sample CSV", () => {
    const result = parseBillingCsv(loadSample("billing-valid.csv"), limits);
    expect(result.missingColumns).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(result.accepted.length).toBe(10);
    expect(result.accepted[0]).toMatchObject({
      billingDate: "2026-01-02",
      provider: "aws",
      service: "AmazonEC2",
      currency: "CAD",
    });
  });

  it("detects missing required columns", () => {
    const result = parseBillingCsv(loadSample("billing-invalid.csv"), limits);
    expect(result.missingColumns).toContain("billing_date");
    expect(result.missingColumns).toContain("provider");
    expect(result.accepted).toEqual([]);
  });

  it("rejects invalid rows while keeping valid ones", () => {
    const csv = `billing_date,provider,service,region,resource_id,usage_quantity,usage_unit,cost,currency,environment
2026-01-02,aws,AmazonEC2,us-east-1,i-1,10,Hrs,1.50,CAD,prod
not-a-date,aws,AmazonEC2,us-east-1,i-2,10,Hrs,1.50,CAD,prod
2026-01-03,aws,AmazonS3,us-east-1,b-1,abc,GB,2.00,CAD,prod
2026-01-04,aws,Credit,global,c-1,1,Credit,-5.00,CAD,prod
`;
    const result = parseBillingCsv(csv, limits);
    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected[0].rowNumber).toBe(3);
    expect(result.accepted.some((row) => Number(row.cost) < 0)).toBe(true);
  });

  it("enforces max rows", () => {
    expect(() =>
      parseBillingCsv(loadSample("billing-valid.csv"), {
        maxBytes: 5_242_880,
        maxRows: 2,
      }),
    ).toThrow(/row limit/i);
  });
});

describe("dedupe", () => {
  it("normalizes decimal strings for stable keys", () => {
    expect(normalizeDecimal("86.40")).toBe(normalizeDecimal("86.4"));
    expect(normalizeDecimal("0")).toBe("0");
  });

  it("builds a stable SHA-256 hex key", () => {
    const row = {
      billingDate: "2026-01-02",
      provider: "aws",
      service: "AmazonEC2",
      region: "us-east-1",
      resourceId: "i-demo001",
      usageQuantity: "720",
      usageUnit: "Hrs",
      cost: "86.40",
      currency: "CAD",
      environment: "prod",
    };
    const key = buildDedupeKey("user-1", row);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(buildDedupeKey("user-1", { ...row, cost: "86.4" })).toBe(key);
    expect(buildDedupeKey("user-2", row)).not.toBe(key);
  });

  it("skips duplicates on commit in the demo store", () => {
    resetDemoStore();
    const parsed = parseBillingCsv(loadSample("billing-duplicates.csv"), limits);
    const first = createDemoImportPreview({
      filename: "billing-duplicates.csv",
      accepted: parsed.accepted,
      rejected: parsed.rejected,
    });
    const firstCommit = commitDemoImport(first.id);
    expect(firstCommit?.inserted).toBe(2);
    expect(firstCommit?.duplicated).toBe(1);

    const secondPreview = createDemoImportPreview({
      filename: "billing-duplicates.csv",
      accepted: parsed.accepted,
      rejected: [],
    });
    const secondCommit = commitDemoImport(secondPreview.id);
    expect(secondCommit?.inserted).toBe(0);
    expect(secondCommit?.duplicated).toBe(3);
    expect(listDemoBillingRecords()).toHaveLength(2);
  });
});
