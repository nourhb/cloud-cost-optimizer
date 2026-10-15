export {
  computeMonthlyForecast,
  inferLatestMonth,
} from "./compute";

export function getForecastPlaceholderMessage(): string {
  return "Month-end forecast uses the CDC linear daily-rate formula with none/low/medium confidence.";
}
