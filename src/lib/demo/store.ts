/**
 * In-memory demo store for NEXT_PUBLIC_DEMO_MODE=true.
 *
 * Persistence model: process-global singleton (survives requests in the same
 * Node.js process; resets on server restart / cold start). Not durable —
 * suitable for local demos without Supabase. HMR-safe via globalThis.
 */

import { randomUUID } from "node:crypto";
import { evaluateAlerts } from "@/features/alerts/evaluate";
import { buildDedupeKey } from "@/features/imports/dedupe";
import { detectCurrencyMode } from "@/features/imports/preview";
import { evaluateRecommendations } from "@/features/recommendations/rules";
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

export type DemoUser = {
  id: string;
  email: string;
  displayName: string;
  preferredCurrency: string;
};

export const demoUser: DemoUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@example.com",
  displayName: "Demo User",
  preferredCurrency: "CAD",
};

type PendingPreview = {
  importId: string;
  accepted: ParsedBillingRow[];
};

type DemoStoreState = {
  imports: BillingImport[];
  records: BillingRecord[];
  dedupeKeys: Set<string>;
  pending: Map<string, PendingPreview>;
  budgets: Budget[];
  alerts: Alert[];
  recommendations: Recommendation[];
};

function createEmptyState(): DemoStoreState {
  return {
    imports: [],
    records: [],
    dedupeKeys: new Set(),
    pending: new Map(),
    budgets: [],
    alerts: [],
    recommendations: [],
  };
}

function getState(): DemoStoreState {
  const globalRef = globalThis as typeof globalThis & {
    __ccoDemoStore?: DemoStoreState;
  };
  if (!globalRef.__ccoDemoStore) {
    globalRef.__ccoDemoStore = createEmptyState();
  }
  // Migrate older HMR singletons that predate MVP collections.
  const state = globalRef.__ccoDemoStore;
  if (!state.budgets) state.budgets = [];
  if (!state.alerts) state.alerts = [];
  if (!state.recommendations) state.recommendations = [];
  return state;
}

/** Reset store — used by unit tests and POST /api/demo/reset. */
export function resetDemoStore(): void {
  const globalRef = globalThis as typeof globalThis & {
    __ccoDemoStore?: DemoStoreState;
  };
  globalRef.__ccoDemoStore = createEmptyState();
}

export function listDemoImports(userId = demoUser.id): BillingImport[] {
  return getState()
    .imports.filter((item) => item.userId === userId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDemoImport(
  id: string,
  userId = demoUser.id,
): BillingImport | null {
  return (
    getState().imports.find(
      (item) => item.id === id && item.userId === userId,
    ) ?? null
  );
}

export function getDemoImportPending(id: string): ParsedBillingRow[] | null {
  return getState().pending.get(id)?.accepted ?? null;
}

export function createDemoImportPreview(input: {
  filename: string;
  accepted: ParsedBillingRow[];
  rejected: ImportRejection[];
  userId?: string;
}): BillingImport {
  const userId = input.userId ?? demoUser.id;
  const { currencyMode, primaryCurrency } = detectCurrencyMode(input.accepted);
  const now = new Date().toISOString();
  const record: BillingImport = {
    id: randomUUID(),
    userId,
    filename: input.filename,
    status: "previewed",
    rowsProcessed: input.accepted.length,
    rowsRejected: input.rejected.length,
    rowsDuplicated: 0,
    currencyMode,
    primaryCurrency,
    errorSummary:
      input.rejected.length > 0 ? { rejections: input.rejected } : null,
    createdAt: now,
    committedAt: null,
  };

  const state = getState();
  state.imports.unshift(record);
  state.pending.set(record.id, {
    importId: record.id,
    accepted: input.accepted,
  });
  return record;
}

export function markDemoImportFailed(
  id: string,
  message: string,
  userId = demoUser.id,
): BillingImport | null {
  const state = getState();
  const item = state.imports.find(
    (entry) => entry.id === id && entry.userId === userId,
  );
  if (!item) {
    return null;
  }
  item.status = "failed";
  item.errorSummary = {
    rejections: [{ rowNumber: 0, message }],
  };
  state.pending.delete(id);
  return item;
}

export type CommitDemoImportResult = {
  import: BillingImport;
  inserted: number;
  duplicated: number;
};

export function commitDemoImport(
  id: string,
  userId = demoUser.id,
): CommitDemoImportResult | null {
  const state = getState();
  const item = state.imports.find(
    (entry) => entry.id === id && entry.userId === userId,
  );
  const pending = state.pending.get(id);
  if (!item || !pending || item.status !== "previewed") {
    return null;
  }

  let inserted = 0;
  let duplicated = 0;
  const now = new Date().toISOString();

  for (const row of pending.accepted) {
    const dedupeKey = buildDedupeKey(userId, row);
    if (state.dedupeKeys.has(dedupeKey)) {
      duplicated += 1;
      continue;
    }

    state.dedupeKeys.add(dedupeKey);
    state.records.push({
      id: randomUUID(),
      userId,
      importId: id,
      billingDate: row.billingDate,
      provider: row.provider,
      service: row.service,
      region: row.region,
      resourceId: row.resourceId,
      usageQuantity: row.usageQuantity,
      usageUnit: row.usageUnit,
      cost: row.cost,
      currency: row.currency,
      environment: row.environment,
      dedupeKey,
      createdAt: now,
    });
    inserted += 1;
  }

  item.status = "committed";
  item.rowsProcessed = inserted;
  item.rowsDuplicated = duplicated;
  item.committedAt = now;
  state.pending.delete(id);

  refreshDemoInsights(userId, id);

  return { import: item, inserted, duplicated };
}

export function listDemoBillingRecords(
  userId = demoUser.id,
): BillingRecord[] {
  return getState().records.filter((record) => record.userId === userId);
}

export function listDemoBudgets(userId = demoUser.id): Budget[] {
  return getState()
    .budgets.filter((budget) => budget.userId === userId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDemoBudget(
  id: string,
  userId = demoUser.id,
): Budget | null {
  return (
    getState().budgets.find(
      (budget) => budget.id === id && budget.userId === userId,
    ) ?? null
  );
}

export function createDemoBudget(
  input: BudgetInput,
  userId = demoUser.id,
): Budget {
  const now = new Date().toISOString();
  const budget: Budget = {
    id: randomUUID(),
    userId,
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    periodStart: input.period_start,
    periodEnd: input.period_end,
    scopeType: input.scope_type,
    scopeValue: input.scope_type === "global" ? null : (input.scope_value ?? null),
    warningThreshold: input.warning_threshold,
    criticalThreshold: input.critical_threshold,
    createdAt: now,
    updatedAt: now,
  };
  getState().budgets.unshift(budget);
  refreshDemoInsights(userId);
  return budget;
}

export function updateDemoBudget(
  id: string,
  input: BudgetInput,
  userId = demoUser.id,
): Budget | null {
  const budget = getDemoBudget(id, userId);
  if (!budget) {
    return null;
  }
  budget.name = input.name;
  budget.amount = input.amount;
  budget.currency = input.currency;
  budget.periodStart = input.period_start;
  budget.periodEnd = input.period_end;
  budget.scopeType = input.scope_type;
  budget.scopeValue =
    input.scope_type === "global" ? null : (input.scope_value ?? null);
  budget.warningThreshold = input.warning_threshold;
  budget.criticalThreshold = input.critical_threshold;
  budget.updatedAt = new Date().toISOString();
  refreshDemoInsights(userId);
  return budget;
}

export function deleteDemoBudget(
  id: string,
  userId = demoUser.id,
): boolean {
  const state = getState();
  const index = state.budgets.findIndex(
    (budget) => budget.id === id && budget.userId === userId,
  );
  if (index < 0) {
    return false;
  }
  state.budgets.splice(index, 1);
  refreshDemoInsights(userId);
  return true;
}

export function listDemoAlerts(userId = demoUser.id): Alert[] {
  return getState()
    .alerts.filter((alert) => alert.userId === userId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listDemoRecommendations(
  userId = demoUser.id,
): Recommendation[] {
  return getState()
    .recommendations.filter((item) => item.userId === userId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Recompute open alerts + active recommendations from current records/budgets.
 * Called after import commit, budget changes, and dashboard refresh.
 */
export function refreshDemoInsights(
  userId = demoUser.id,
  importId: string | null = null,
): { alerts: Alert[]; recommendations: Recommendation[] } {
  const state = getState();
  const records = state.records.filter((row) => row.userId === userId);
  const budgets = state.budgets.filter((row) => row.userId === userId);
  const now = new Date().toISOString();

  const evaluatedAlerts = evaluateAlerts({ records, budgets, importId });
  state.alerts = [
    ...state.alerts.filter(
      (alert) => alert.userId !== userId || alert.status !== "open",
    ),
    ...evaluatedAlerts.map((alert) => ({
      ...alert,
      id: randomUUID(),
      userId,
      status: "open" as const,
      createdAt: now,
      resolvedAt: null,
    })),
  ];

  const evaluatedRecs = evaluateRecommendations({
    records,
    budgets,
    importId,
  });
  state.recommendations = [
    ...state.recommendations.filter(
      (item) => item.userId !== userId || item.status !== "active",
    ),
    ...evaluatedRecs.map((item) => ({
      ...item,
      id: randomUUID(),
      userId,
      status: "active" as const,
      createdAt: now,
    })),
  ];

  return {
    alerts: listDemoAlerts(userId),
    recommendations: listDemoRecommendations(userId),
  };
}

export function acknowledgeDemoAlert(
  id: string,
  userId = demoUser.id,
): Alert | null {
  const alert = getState().alerts.find(
    (item) => item.id === id && item.userId === userId,
  );
  if (!alert) {
    return null;
  }
  alert.status = "acknowledged";
  return alert;
}

/** @deprecated Prefer listDemoImports / billing summary helpers. */
export function getDemoImportHistory(): BillingImport[] {
  return listDemoImports();
}

/** @deprecated Prefer summarizeBilling from features/billing. */
export function getDemoBillingSummary() {
  const records = listDemoBillingRecords();
  if (records.length === 0) {
    return {
      totalCost: null,
      currency: demoUser.preferredCurrency,
      periodLabel: "No data yet",
      message: "Import a billing CSV to populate the dashboard.",
    };
  }
  return {
    totalCost: null,
    currency: demoUser.preferredCurrency,
    periodLabel: "See /api/billing/summary",
    message: `${records.length} billing rows loaded in demo store.`,
  };
}
