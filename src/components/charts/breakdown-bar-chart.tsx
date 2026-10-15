"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { name: string; amount: number; currency: string };

export function BreakdownBarChart({
  data,
  emptyLabel = "No breakdown for this filter.",
}: {
  data: Point[];
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const chartData = data.slice(0, 8).map((row) => ({
    ...row,
    label: row.name.length > 18 ? `${row.name.slice(0, 16)}…` : row.name,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 12 }} width={56} />
          <Tooltip
            formatter={(value) => {
              const amount = typeof value === "number" ? value : Number(value);
              return [
                Number.isFinite(amount) ? amount.toFixed(2) : String(value),
                "Cost",
              ];
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as Point | undefined;
              return row?.name ?? "";
            }}
          />
          <Bar
            dataKey="amount"
            fill="var(--color-chart-2, #1d4ed8)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
