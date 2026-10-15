import type { ParsedBillingRow } from "@/types/domain";

export function detectCurrencyMode(rows: ParsedBillingRow[]): {
  currencyMode: "single" | "separated";
  primaryCurrency: string | null;
} {
  const currencies = [...new Set(rows.map((row) => row.currency))];
  if (currencies.length <= 1) {
    return {
      currencyMode: "single",
      primaryCurrency: currencies[0] ?? null,
    };
  }
  return {
    currencyMode: "separated",
    primaryCurrency: null,
  };
}

export function previewSample(
  rows: ParsedBillingRow[],
  limit = 10,
): ParsedBillingRow[] {
  return rows.slice(0, limit);
}
