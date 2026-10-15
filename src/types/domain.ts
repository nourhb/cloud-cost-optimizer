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

export type BudgetScopeType = "global" | "service" | "environment" | "provider";

export type AlertType =
  | "budget_warning"
  | "budget_critical"
  | "daily_spike"
  | "service_surge"
  | "insufficient_data";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export type RecommendationCategory =
  | "concentration"
  | "growth"
  | "budget_risk"
  | "environment_skew";

export type RecommendationStatus = "active" | "dismissed" | "completed";

export type BillingRecord = {
  id: string;
  userId: string;
  importId: string;
  billingDate: string;
  provider: string;
  service: string;
  region: string;
  resourceId: string;
  usageQuantity: string;
  usageUnit: string;
  cost: string;
  currency: CurrencyCode;
  environment: string;
  dedupeKey: string;
  createdAt: string;
};

export type ImportRejection = {
  rowNumber: number;
  message: string;
};

export type BillingImport = {
  id: string;
  userId: string;
  filename: string;
  status: BillingImportStatus;
  rowsProcessed: number;
  rowsRejected: number;
  rowsDuplicated: number;
  currencyMode: "single" | "separated";
  primaryCurrency: CurrencyCode | null;
  errorSummary: { rejections: ImportRejection[] } | null;
  createdAt: string;
  committedAt: string | null;
};

export type ParsedBillingRow = {
  billingDate: string;
  provider: string;
  service: string;
  region: string;
  resourceId: string;
  usageQuantity: string;
  usageUnit: string;
  cost: string;
  currency: CurrencyCode;
  environment: string;
};

export type Budget = {
  id: string;
  userId: string;
  name: string;
  amount: string;
  currency: CurrencyCode;
  periodStart: string;
  periodEnd: string;
  scopeType: BudgetScopeType;
  scopeValue: string | null;
  warningThreshold: number;
  criticalThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type Alert = {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  triggerData: Record<string, unknown>;
  recommendedAction: string | null;
  relatedBudgetId: string | null;
  importId: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type Recommendation = {
  id: string;
  userId: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  proposedAction: string;
  estimatedSavings: string | null;
  estimatedSavingsCurrency: CurrencyCode | null;
  limitations: string;
  status: RecommendationStatus;
  importId: string | null;
  createdAt: string;
};

export type ForecastResult = {
  currency: CurrencyCode;
  observedSpend: string;
  daysElapsed: number;
  daysInMonth: number;
  distinctDaysWithData: number;
  forecastMonthEnd: string | null;
  confidence: ForecastConfidence;
  limitations: string;
  month: string;
  budgetAmount: string | null;
  budgetGap: string | null;
};
