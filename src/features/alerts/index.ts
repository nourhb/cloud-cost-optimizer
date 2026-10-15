export { evaluateAlerts, type EvaluatedAlert } from "./evaluate";

export function getAlertsPlaceholderMessage(): string {
  return "Alerts are evaluated after each import and when the dashboard refreshes.";
}
