import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  BillingImport,
  BillingImportStatus,
  BillingRecord,
  Budget,
  BudgetScopeType,
  ImportRejection,
  ParsedBillingRow,
  Recommendation,
  RecommendationCategory,
  RecommendationStatus,
} from "@/types/domain";

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
};

export type BillingImportRow = {
  id: string;
  user_id: string;
  filename: string;
  status: BillingImportStatus;
  rows_processed: number;
  rows_rejected: number;
  rows_duplicated: number;
  currency_mode: "single" | "separated";
  primary_currency: string | null;
  error_summary: { rejections?: ImportRejection[] } | null;
  preview_rows: ParsedBillingRow[] | null;
  created_at: string;
  committed_at: string | null;
};

export type BillingRecordRow = {
  id: string;
  user_id: string;
  import_id: string;
  billing_date: string;
  provider: string;
  service: string;
  region: string;
  resource_id: string;
  usage_quantity: string | number;
  usage_unit: string;
  cost: string | number;
  currency: string;
  environment: string;
  dedupe_key: string;
  created_at: string;
};

export type BudgetRow = {
  id: string;
  user_id: string;
  name: string;
  amount: string | number;
  currency: string;
  period_start: string;
  period_end: string;
  scope_type: BudgetScopeType;
  scope_value: string | null;
  warning_threshold: string | number;
  critical_threshold: string | number;
  created_at: string;
  updated_at: string;
};

export type AlertRow = {
  id: string;
  user_id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  trigger_data: Record<string, unknown>;
  recommended_action: string | null;
  related_budget_id: string | null;
  import_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type RecommendationRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  proposed_action: string;
  estimated_savings: string | number | null;
  estimated_savings_currency: string | null;
  limitations: string;
  status: RecommendationStatus;
  import_id: string | null;
  created_at: string;
};

function decimalString(value: string | number): string {
  if (typeof value === "number") {
    return value.toString();
  }
  return value;
}

export function mapImport(row: BillingImportRow): BillingImport {
  return {
    id: row.id,
    userId: row.user_id,
    filename: row.filename,
    status: row.status,
    rowsProcessed: row.rows_processed,
    rowsRejected: row.rows_rejected,
    rowsDuplicated: row.rows_duplicated,
    currencyMode: row.currency_mode,
    primaryCurrency: row.primary_currency,
    errorSummary: row.error_summary?.rejections
      ? { rejections: row.error_summary.rejections }
      : null,
    createdAt: row.created_at,
    committedAt: row.committed_at,
  };
}

export function mapRecord(row: BillingRecordRow): BillingRecord {
  return {
    id: row.id,
    userId: row.user_id,
    importId: row.import_id,
    billingDate: row.billing_date,
    provider: row.provider,
    service: row.service,
    region: row.region,
    resourceId: row.resource_id,
    usageQuantity: decimalString(row.usage_quantity),
    usageUnit: row.usage_unit,
    cost: decimalString(row.cost),
    currency: row.currency,
    environment: row.environment,
    dedupeKey: row.dedupe_key,
    createdAt: row.created_at,
  };
}

export function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amount: decimalString(row.amount),
    currency: row.currency,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    scopeType: row.scope_type,
    scopeValue: row.scope_value,
    warningThreshold: Number(row.warning_threshold),
    criticalThreshold: Number(row.critical_threshold),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as AlertType,
    severity: row.severity,
    title: row.title,
    description: row.description,
    status: row.status,
    triggerData: row.trigger_data ?? {},
    recommendedAction: row.recommended_action,
    relatedBudgetId: row.related_budget_id,
    importId: row.import_id,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export function mapRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as RecommendationCategory,
    title: row.title,
    description: row.description,
    evidence: row.evidence ?? {},
    proposedAction: row.proposed_action,
    estimatedSavings:
      row.estimated_savings === null || row.estimated_savings === undefined
        ? null
        : decimalString(row.estimated_savings),
    estimatedSavingsCurrency: row.estimated_savings_currency,
    limitations: row.limitations,
    status: row.status,
    importId: row.import_id,
    createdAt: row.created_at,
  };
}
