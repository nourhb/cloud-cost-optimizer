import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Alert, BillingRecord, Budget, Recommendation } from "@/types/domain";
import { summarizeBilling } from "@/features/billing";
import { computeMonthlyForecast, inferLatestMonth } from "@/features/forecast";
import { evaluateBudgetSpend } from "@/features/budgets";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: { fontSize: 18, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#4b5563", marginBottom: 16 },
  section: { marginTop: 14, marginBottom: 6, fontSize: 12, fontFamily: "Helvetica-Bold" },
  row: { marginBottom: 3, lineHeight: 1.4 },
  muted: { color: "#6b7280" },
  box: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
    marginBottom: 6,
  },
});

export type ReportPayload = {
  records: BillingRecord[];
  budgets: Budget[];
  alerts: Alert[];
  recommendations: Recommendation[];
  generatedAt: string;
};

function ReportDocument({ payload }: { payload: ReportPayload }) {
  const summary = summarizeBilling(payload.records);
  const month = inferLatestMonth(payload.records);
  const currency =
    summary.totalsByCurrency[0]?.currency ??
    payload.records[0]?.currency ??
    "CAD";
  const globalBudget =
    payload.budgets.find(
      (budget) => budget.scopeType === "global" && budget.currency === currency,
    ) ?? null;
  const forecast = month
    ? computeMonthlyForecast({
        records: payload.records,
        currency,
        month,
        budget: globalBudget,
      })
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Cloud Cost Optimizer — Spend Report</Text>
        <Text style={styles.subtitle}>
          Generated {payload.generatedAt} · Demo mode · Advisory only (no cloud
          mutations)
        </Text>

        <Text style={styles.section}>Totals</Text>
        {summary.totalsByCurrency.length === 0 ? (
          <Text style={styles.muted}>No billing rows in scope.</Text>
        ) : (
          summary.totalsByCurrency.map((total) => (
            <Text key={total.currency} style={styles.row}>
              {total.currency}: {Number(total.amount).toFixed(2)} ({summary.recordCount}{" "}
              rows)
            </Text>
          ))
        )}

        <Text style={styles.section}>Top services</Text>
        {summary.topServices.slice(0, 8).map((row) => (
          <Text key={`${row.name}-${row.currency}`} style={styles.row}>
            {row.name}: {row.amount.toFixed(2)} {row.currency}
          </Text>
        ))}

        <Text style={styles.section}>Regions</Text>
        {summary.byRegion.slice(0, 8).map((row) => (
          <Text key={`${row.name}-${row.currency}`} style={styles.row}>
            {row.name}: {row.amount.toFixed(2)} {row.currency}
          </Text>
        ))}

        <Text style={styles.section}>Budgets</Text>
        {payload.budgets.length === 0 ? (
          <Text style={styles.muted}>No budgets configured.</Text>
        ) : (
          payload.budgets.map((budget) => {
            const spend = evaluateBudgetSpend(budget, payload.records);
            return (
              <View key={budget.id} style={styles.box}>
                <Text>
                  {budget.name} — {spend.utilizationPercent.toFixed(1)}% used (
                  {spend.status})
                </Text>
                <Text style={styles.muted}>
                  {spend.spent.toFixed(2)} / {budget.amount} {budget.currency} ·{" "}
                  {budget.scopeType}
                  {budget.scopeValue ? `:${budget.scopeValue}` : ""}
                </Text>
              </View>
            );
          })
        )}

        <Text style={styles.section}>Forecast</Text>
        {forecast ? (
          <View style={styles.box}>
            <Text>
              {forecast.month} · confidence {forecast.confidence}
            </Text>
            <Text style={styles.muted}>
              Observed {Number(forecast.observedSpend).toFixed(2)} {forecast.currency}
              {forecast.forecastMonthEnd
                ? ` · projected ${Number(forecast.forecastMonthEnd).toFixed(2)}`
                : " · forecast hidden"}
            </Text>
            <Text style={styles.muted}>{forecast.limitations}</Text>
          </View>
        ) : (
          <Text style={styles.muted}>No forecast available.</Text>
        )}

        <Text style={styles.section}>Open alerts</Text>
        {payload.alerts.filter((a) => a.status === "open").length === 0 ? (
          <Text style={styles.muted}>No open alerts.</Text>
        ) : (
          payload.alerts
            .filter((a) => a.status === "open")
            .slice(0, 10)
            .map((alert) => (
              <View key={alert.id} style={styles.box}>
                <Text>
                  [{alert.severity}] {alert.title}
                </Text>
                <Text style={styles.muted}>{alert.description}</Text>
              </View>
            ))
        )}

        <Text style={styles.section}>Recommendations</Text>
        {payload.recommendations.filter((r) => r.status === "active").length ===
        0 ? (
          <Text style={styles.muted}>No active recommendations.</Text>
        ) : (
          payload.recommendations
            .filter((r) => r.status === "active")
            .slice(0, 10)
            .map((rec) => (
              <View key={rec.id} style={styles.box}>
                <Text>
                  [{rec.category}] {rec.title}
                </Text>
                <Text style={styles.muted}>{rec.description}</Text>
                <Text style={styles.muted}>Action: {rec.proposedAction}</Text>
                <Text style={styles.muted}>Limits: {rec.limitations}</Text>
              </View>
            ))
        )}
      </Page>
    </Document>
  );
}

export async function renderReportPdf(
  payload: ReportPayload,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ReportDocument payload={payload} />,
  );
  return Buffer.from(buffer);
}
