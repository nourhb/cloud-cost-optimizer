export {
  summarizeBilling,
  type BillingSummary,
  type CurrencyTotal,
  type NamedAmount,
} from "./aggregate";

export function getBillingPlaceholderMessage(): string {
  return "Cost analysis and charts will appear once billing data is imported.";
}
