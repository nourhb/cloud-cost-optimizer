import { evaluateBudgetSpend } from "@/features/budgets/evaluate";
import type {
  BillingRecord,
  Budget,
  Recommendation,
  RecommendationCategory,
} from "@/types/domain";

export type EvaluatedRecommendation = Omit<
  Recommendation,
  "id" | "userId" | "status" | "createdAt"
>;

const CONCENTRATION_SHARE = 0.4;
const GROWTH_RATIO = 1.4;
const ENV_SKEW_SHARE = 0.7;

function draft(input: {
  category: RecommendationCategory;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  proposedAction: string;
  estimatedSavings?: string | null;
  estimatedSavingsCurrency?: string | null;
  limitations: string;
  importId?: string | null;
}): EvaluatedRecommendation {
  return {
    category: input.category,
    title: input.title,
    description: input.description,
    evidence: input.evidence,
    proposedAction: input.proposedAction,
    estimatedSavings: input.estimatedSavings ?? null,
    estimatedSavingsCurrency: input.estimatedSavingsCurrency ?? null,
    limitations: input.limitations,
    importId: input.importId ?? null,
  };
}

export function evaluateRecommendations(input: {
  records: BillingRecord[];
  budgets: Budget[];
  importId?: string | null;
}): EvaluatedRecommendation[] {
  const { records, budgets, importId = null } = input;
  const recommendations: EvaluatedRecommendation[] = [];

  if (records.length === 0) {
    return recommendations;
  }

  const byCurrency = new Map<string, BillingRecord[]>();
  for (const record of records) {
    const list = byCurrency.get(record.currency) ?? [];
    list.push(record);
    byCurrency.set(record.currency, list);
  }

  for (const [currency, currencyRows] of byCurrency) {
    const total = currencyRows.reduce((sum, row) => sum + Number(row.cost), 0);
    if (total <= 0) {
      continue;
    }

    const byService = sumBy(currencyRows, (row) => row.service);
    const topService = [...byService.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topService && topService[1] / total >= CONCENTRATION_SHARE) {
      const share = topService[1] / total;
      recommendations.push(
        draft({
          category: "concentration",
          title: `${topService[0]} dominates ${currency} spend`,
          description: `${topService[0]} accounts for ${(share * 100).toFixed(1)}% of observed ${currency} spend (${topService[1].toFixed(2)} of ${total.toFixed(2)}).`,
          evidence: {
            currency,
            service: topService[0],
            serviceSpend: topService[1],
            totalSpend: total,
            share,
          },
          proposedAction:
            "Review rightsizing, reserved capacity, or workload placement for this service — advisory only; no cloud changes are applied automatically.",
          limitations:
            "Billing data alone cannot prove idle CPU/memory. Validate utilization with metrics before resizing.",
          importId,
        }),
      );
    }

    const byEnvironment = sumBy(currencyRows, (row) => row.environment);
    const topEnv = [...byEnvironment.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topEnv && topEnv[1] / total >= ENV_SKEW_SHARE) {
      recommendations.push(
        draft({
          category: "environment_skew",
          title: `Spend concentrated in ${topEnv[0]}`,
          description: `${topEnv[0]} holds ${((topEnv[1] / total) * 100).toFixed(1)}% of ${currency} spend.`,
          evidence: {
            currency,
            environment: topEnv[0],
            environmentSpend: topEnv[1],
            totalSpend: total,
            share: topEnv[1] / total,
          },
          proposedAction:
            "Confirm non-production environments are scheduled/scaled appropriately and tagged for ownership.",
          limitations:
            "Environment labels come from the CSV. Mis-tagged rows can skew this recommendation.",
          importId,
        }),
      );
    }

    // Growth: compare earliest third vs latest third of distinct days.
    const days = [...new Set(currencyRows.map((row) => row.billingDate))].sort();
    if (days.length >= 6) {
      const earlyEnd = days[Math.floor(days.length / 3)];
      const lateStart = days[Math.floor((days.length * 2) / 3)];
      for (const [service] of byService) {
        const early = currencyRows
          .filter((row) => row.service === service && row.billingDate <= earlyEnd)
          .reduce((sum, row) => sum + Number(row.cost), 0);
        const late = currencyRows
          .filter((row) => row.service === service && row.billingDate >= lateStart)
          .reduce((sum, row) => sum + Number(row.cost), 0);
        if (early > 0 && late / early >= GROWTH_RATIO && late >= 5) {
          recommendations.push(
            draft({
              category: "growth",
              title: `Rising cost: ${service}`,
              description: `${service} grew from ${early.toFixed(2)} to ${late.toFixed(2)} ${currency} between the start and end of the observed window.`,
              evidence: {
                currency,
                service,
                early,
                late,
                ratio: late / early,
                earlyEnd,
                lateStart,
              },
              proposedAction:
                "Investigate recent deployments or traffic changes for this service and set a scoped budget if none exists.",
              limitations:
                "Short windows can exaggerate growth. Prefer ≥ 2 weeks of data before acting.",
              importId,
            }),
          );
        }
      }
    }
  }

  for (const budget of budgets) {
    const spend = evaluateBudgetSpend(budget, records);
    if (spend.status === "warning" || spend.status === "critical") {
      const remaining = Math.max(spend.remaining, 0);
      recommendations.push(
        draft({
          category: "budget_risk",
          title: `Budget at risk: ${budget.name}`,
          description: `${spend.utilizationPercent.toFixed(1)}% of ${budget.amount} ${budget.currency} is already consumed (${spend.status}).`,
          evidence: {
            budgetId: budget.id,
            spent: spend.spent,
            remaining: spend.remaining,
            utilizationPercent: spend.utilizationPercent,
            status: spend.status,
            scopeType: budget.scopeType,
            scopeValue: budget.scopeValue,
          },
          proposedAction:
            "Prioritize cost owners for the budget scope and pause non-critical experiments until the period resets.",
          estimatedSavings:
            spend.remaining < 0 ? Math.abs(spend.remaining).toFixed(6) : null,
          estimatedSavingsCurrency:
            spend.remaining < 0 ? budget.currency : null,
          limitations:
            spend.remaining < 0
              ? "Estimated overage equals current overrun; future overrun may differ."
              : `About ${remaining.toFixed(2)} ${budget.currency} remains before the hard limit.`,
          importId,
        }),
      );
    }
  }

  return recommendations;
}

function sumBy(
  records: BillingRecord[],
  keyFn: (record: BillingRecord) => string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const record of records) {
    const key = keyFn(record);
    map.set(key, (map.get(key) ?? 0) + Number(record.cost));
  }
  return map;
}
