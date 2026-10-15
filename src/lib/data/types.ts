import type { BudgetInput } from "@/schemas/budget";
import type {
  Alert,
  BillingImport,
  BillingRecord,
  Budget,
  ImportRejection,
  ParsedBillingRow,
  Recommendation,
} from "@/types/domain";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  preferredCurrency: string;
};

export type CommitImportResult = {
  import: BillingImport;
  inserted: number;
  duplicated: number;
};

export type DataBackendKind = "demo" | "supabase";

export type DataBackend = {
  kind: DataBackendKind;
  user: SessionUser;
  listImports(): Promise<BillingImport[]>;
  getImport(id: string): Promise<BillingImport | null>;
  getImportPending(id: string): Promise<ParsedBillingRow[] | null>;
  createImportPreview(input: {
    filename: string;
    accepted: ParsedBillingRow[];
    rejected: ImportRejection[];
  }): Promise<BillingImport>;
  markImportFailed(id: string, message: string): Promise<BillingImport | null>;
  commitImport(id: string): Promise<CommitImportResult | null>;
  listBillingRecords(): Promise<BillingRecord[]>;
  listBudgets(): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | null>;
  createBudget(input: BudgetInput): Promise<Budget>;
  updateBudget(id: string, input: BudgetInput): Promise<Budget | null>;
  deleteBudget(id: string): Promise<boolean>;
  listAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<Alert | null>;
  listRecommendations(): Promise<Recommendation[]>;
  refreshInsights(importId?: string | null): Promise<{
    alerts: Alert[];
    recommendations: Recommendation[];
  }>;
};
