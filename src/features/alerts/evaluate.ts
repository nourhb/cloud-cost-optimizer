import { evaluateBudgetSpend } from "@/features/budgets/evaluate";
import type {
  Alert,
  AlertSeverity,
  AlertType,
  BillingRecord,
  Budget,
} from "@/types/domain";

export type EvaluatedAlert = Omit<
  Alert,
  "id" | "userId" | "status" | "createdAt" | "resolvedAt"
>;

const DAILY_SPIKE_RATIO = 2.5;
const SERVICE_SURGE_RATIO = 1.5;

function draft(input: {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  triggerData: Record<string, unknown>;
  recommendedAction: string;
  relatedBudgetId?: string | null;
  importId?: string | null;
}): EvaluatedAlert {
  return {
    type: input.type,
    severity: input.severity,
    title: input.title,
    description: input.description,
    triggerData: input.triggerData,
    recommendedAction: input.recommendedAction,
    relatedBudgetId: input.relatedBudgetId ?? null,
    importId: input.importId ?? null,
  };
}

export function evaluateAlerts(input: {
  records: BillingRecord[];
  budgets: Budget[];
  importId?: string | null;
}): EvaluatedAlert[] {
  const alerts: EvaluatedAlert[] = [];
  const { records, budgets, importId = null } = input;

  if (records.length === 0) {
    alerts.push(
      draft({
        type: "insufficient_data",
        severity: "info",
        title: "No billing data available",
        description:
          "Import a billing CSV before budget thresholds and spend comparisons can be evaluated.",
        triggerData: { recordCount: 0 },
        recommendedAction: "Upload a valid billing CSV from Imports → New import.",
        importId,
      }),
    );
    return alerts;
  }

  for (const budget of budgets) {
    const spend = evaluateBudgetSpend(budget, records);
    if (spend.status === "critical") {
      alerts.push(
        draft({
          type: "budget_critical",
          severity: "critical",
          title: `Critical: ${budget.name}`,
          description: `Spend reached ${spend.utilizationPercent.toFixed(1)}% of the ${budget.amount} ${budget.currency} budget (critical ≥ ${budget.criticalThreshold}%).`,
          triggerData: {
            spent: spend.spent,
            budgetAmount: Number(budget.amount),
            utilizationPercent: spend.utilizationPercent,
            scopeType: budget.scopeType,
            scopeValue: budget.scopeValue,
          },
          recommendedAction:
            "Review the top services in Analysis and adjust spend or raise the budget with stakeholder approval.",
          relatedBudgetId: budget.id,
          importId,
        }),
      );
    } else if (spend.status === "warning") {
      alerts.push(
        draft({
          type: "budget_warning",
          severity: "warning",
          title: `Warning: ${budget.name}`,
          description: `Spend reached ${spend.utilizationPercent.toFixed(1)}% of the ${budget.amount} ${budget.currency} budget (warning ≥ ${budget.warningThreshold}%).`,
          triggerData: {
            spent: spend.spent,
            budgetAmount: Number(budget.amount),
            utilizationPercent: spend.utilizationPercent,
            scopeType: budget.scopeType,
            scopeValue: budget.scopeValue,
          },
          recommendedAction:
            "Monitor daily burn and identify optional workloads that can be deferred this period.",
          relatedBudgetId: budget.id,
          importId,
        }),
      );
    }
  }

  const byCurrency = groupBy(records, (row) => row.currency);
  for (const [currency, currencyRows] of byCurrency) {
    const byDay = new Map<string, number>();
    for (const row of currencyRows) {
      byDay.set(row.billingDate, (byDay.get(row.billingDate) ?? 0) + Number(row.cost));
    }
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (days.length < 3) {
      alerts.push(
        draft({
          type: "insufficient_data",
          severity: "info",
          title: `Limited history for ${currency}`,
          description: `Only ${days.length} day(s) of ${currency} spend are available — daily comparisons are not reliable yet.`,
          triggerData: { currency, distinctDays: days.length },
          recommendedAction:
            "Import additional days of billing data before treating spike alerts as actionable.",
          importId,
        }),
      );
      continue;
    }

    const amounts = days.map(([, amount]) => amount);
    const mean =
      amounts.reduce((sum, value) => sum + value, 0) / Math.max(amounts.length, 1);
    const latest = days[days.length - 1];
    if (mean > 0 && latest[1] >= mean * DAILY_SPIKE_RATIO) {
      alerts.push(
        draft({
          type: "daily_spike",
          severity: "warning",
          title: `Daily spend spike (${currency})`,
          description: `Spend on ${latest[0]} was ${latest[1].toFixed(2)} ${currency}, about ${(latest[1] / mean).toFixed(1)}× the daily average.`,
          triggerData: {
            currency,
            date: latest[0],
            amount: latest[1],
            dailyAverage: mean,
            ratio: latest[1] / mean,
          },
          recommendedAction:
            "Check which services drove that day in Analysis and confirm whether the spike was expected (batch jobs, migrations).",
          importId,
        }),
      );
    }

    // Service surge: compare first half vs second half of timeline for top services.
    const midpoint = days[Math.floor(days.length / 2)][0];
    const serviceTotals = new Map<string, { early: number; late: number }>();
    for (const row of currencyRows) {
      const bucket = serviceTotals.get(row.service) ?? { early: 0, late: 0 };
      if (row.billingDate <= midpoint) {
        bucket.early += Number(row.cost);
      } else {
        bucket.late += Number(row.cost);
      }
      serviceTotals.set(row.service, bucket);
    }

    for (const [service, totals] of serviceTotals) {
      if (totals.early <= 0) {
        continue;
      }
      const ratio = totals.late / totals.early;
      if (ratio >= SERVICE_SURGE_RATIO && totals.late >= 10) {
        alerts.push(
          draft({
            type: "service_surge",
            severity: "warning",
            title: `Service surge: ${service}`,
            description: `${service} rose from ${totals.early.toFixed(2)} to ${totals.late.toFixed(2)} ${currency} across the period (${ratio.toFixed(1)}×).`,
            triggerData: {
              currency,
              service,
              early: totals.early,
              late: totals.late,
              ratio,
              midpoint,
            },
            recommendedAction:
              "Review recent changes for this service (scale-out, new environments) and confirm ownership of the growth.",
            importId,
          }),
        );
      }
    }
  }

  return alerts;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}
