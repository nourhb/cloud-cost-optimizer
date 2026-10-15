import type { BillingRecord, Budget } from "@/types/domain";

export type BudgetSpend = {
  budget: Budget;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  status: "ok" | "warning" | "critical";
};

export function recordsInBudgetScope(
  records: BillingRecord[],
  budget: Budget,
): BillingRecord[] {
  return records.filter((record) => {
    if (record.currency !== budget.currency) {
      return false;
    }
    if (
      record.billingDate < budget.periodStart ||
      record.billingDate > budget.periodEnd
    ) {
      return false;
    }
    switch (budget.scopeType) {
      case "global":
        return true;
      case "service":
        return record.service === budget.scopeValue;
      case "environment":
        return record.environment === budget.scopeValue;
      case "provider":
        return record.provider === budget.scopeValue;
      default:
        return false;
    }
  });
}

export function evaluateBudgetSpend(
  budget: Budget,
  records: BillingRecord[],
): BudgetSpend {
  const scoped = recordsInBudgetScope(records, budget);
  const spent = scoped.reduce((sum, row) => sum + Number(row.cost), 0);
  const limit = Number(budget.amount);
  const remaining = limit - spent;
  const utilizationPercent = limit === 0 ? 0 : (spent / limit) * 100;

  let status: BudgetSpend["status"] = "ok";
  if (utilizationPercent >= budget.criticalThreshold) {
    status = "critical";
  } else if (utilizationPercent >= budget.warningThreshold) {
    status = "warning";
  }

  return {
    budget,
    spent,
    remaining,
    utilizationPercent,
    status,
  };
}
