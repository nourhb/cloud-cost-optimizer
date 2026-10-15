import { summarizeBilling } from "@/features/billing";
import type { BillingFilters } from "@/schemas/filters";
import type { Alert, BillingRecord, Budget, Recommendation } from "@/types/domain";

function csvEscape(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildBillingCsv(records: BillingRecord[]): string {
  const header = [
    "billing_date",
    "provider",
    "service",
    "region",
    "resource_id",
    "usage_quantity",
    "usage_unit",
    "cost",
    "currency",
    "environment",
  ];
  const lines = [header.join(",")];
  for (const row of records) {
    lines.push(
      [
        row.billingDate,
        row.provider,
        row.service,
        row.region,
        row.resourceId,
        row.usageQuantity,
        row.usageUnit,
        row.cost,
        row.currency,
        row.environment,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function buildAnalysisSummaryCsv(input: {
  records: BillingRecord[];
  budgets: Budget[];
  alerts: Alert[];
  recommendations: Recommendation[];
  filters?: BillingFilters;
}): string {
  const summary = summarizeBilling(input.records, input.filters ?? {});
  const lines: string[] = ["section,key,value,currency"];

  for (const total of summary.totalsByCurrency) {
    lines.push(
      ["total", "spend", total.amount, total.currency].map(csvEscape).join(","),
    );
  }
  for (const row of summary.byService) {
    lines.push(
      ["by_service", row.name, row.amount.toFixed(6), row.currency]
        .map(csvEscape)
        .join(","),
    );
  }
  for (const row of summary.byRegion) {
    lines.push(
      ["by_region", row.name, row.amount.toFixed(6), row.currency]
        .map(csvEscape)
        .join(","),
    );
  }
  lines.push(
    ["counts", "alerts_open", String(input.alerts.filter((a) => a.status === "open").length), ""]
      .map(csvEscape)
      .join(","),
  );
  lines.push(
    [
      "counts",
      "recommendations_active",
      String(input.recommendations.filter((r) => r.status === "active").length),
      "",
    ]
      .map(csvEscape)
      .join(","),
  );
  lines.push(
    ["counts", "budgets", String(input.budgets.length), ""].map(csvEscape).join(","),
  );

  return `${lines.join("\n")}\n`;
}
