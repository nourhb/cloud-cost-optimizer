export { buildBillingCsv, buildAnalysisSummaryCsv } from "./build-csv";
export { renderReportPdf, type ReportPayload } from "./build-pdf";

export function getReportsPlaceholderMessage(): string {
  return "Export tabular analysis as CSV or a stakeholder PDF report from the data currently loaded in demo mode.";
}
