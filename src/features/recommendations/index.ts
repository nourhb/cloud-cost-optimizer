export {
  evaluateRecommendations,
  type EvaluatedRecommendation,
} from "./rules";

export function getRecommendationsPlaceholderMessage(): string {
  return "Rule-based, explainable recommendations appear after billing data is imported. Advisory only — no cloud changes.";
}
