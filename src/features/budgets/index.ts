export {
  evaluateBudgetSpend,
  recordsInBudgetScope,
  type BudgetSpend,
} from "./evaluate";

export function getBudgetsPlaceholderMessage(): string {
  return "Create a monthly global or per-service budget to track spend against warning and critical thresholds.";
}
