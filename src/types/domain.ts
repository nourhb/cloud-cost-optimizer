export type CurrencyCode = string;

export type Money = {
  amount: string;
  currency: CurrencyCode;
};

export type BillingImportStatus =
  | "pending"
  | "previewed"
  | "committed"
  | "failed";

export type AlertSeverity = "info" | "warning" | "critical";

export type ForecastConfidence = "none" | "low" | "medium";
