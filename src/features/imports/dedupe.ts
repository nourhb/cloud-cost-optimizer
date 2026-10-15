import { createHash } from "node:crypto";
import type { ParsedBillingRow } from "@/types/domain";

/**
 * Dedupe key per architecture §3.1:
 * SHA-256 hex of normalized concatenation:
 * user_id | billing_date | provider | service | region | resource_id |
 * usage_quantity | usage_unit | cost | currency | environment
 */
export function buildDedupeKey(
  userId: string,
  row: ParsedBillingRow,
): string {
  const parts = [
    userId,
    row.billingDate,
    row.provider,
    row.service,
    row.region,
    row.resourceId,
    normalizeDecimal(row.usageQuantity),
    row.usageUnit,
    normalizeDecimal(row.cost),
    row.currency.toUpperCase(),
    row.environment,
  ];

  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex");
}

/** Normalize decimal string so 86.40 and 86.4 hash the same. */
export function normalizeDecimal(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return value.trim();
  }
  // Avoid scientific notation for typical billing magnitudes.
  return num.toFixed(8).replace(/\.?0+$/, "") || "0";
}
