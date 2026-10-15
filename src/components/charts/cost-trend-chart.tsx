"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; amount: number; currency: string };

export function CostTrendChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No trend points for this filter.</p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={56} />
          <Tooltip
            formatter={(value) => {
              const amount = typeof value === "number" ? value : Number(value);
              return [
                Number.isFinite(amount) ? amount.toFixed(2) : String(value),
                "Cost",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="var(--color-chart-1, #0f766e)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
