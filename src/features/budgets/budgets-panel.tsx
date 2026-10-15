"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import type { Budget } from "@/types/domain";
import type { BudgetSpend } from "@/features/budgets";

type BudgetWithSpend = Budget & { spend: BudgetSpend };

const emptyForm = {
  name: "Monthly cloud budget",
  amount: "500",
  currency: "CAD",
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  scope_type: "global" as "global" | "service" | "environment" | "provider",
  scope_value: "",
  warning_threshold: "80",
  critical_threshold: "100",
};

export function BudgetsPanel() {
  const [budgets, setBudgets] = useState<BudgetWithSpend[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const response = await fetch("/api/budgets");
      const data = (await response.json()) as {
        budgets?: BudgetWithSpend[];
        message?: string;
      };
      if (!response.ok) {
        setError(data.message ?? "Could not load budgets.");
        return;
      }
      setBudgets(data.budgets ?? []);
      setError(null);
    });
  }

  useEffect(() => {
    load();
  }, []);

  function onSubmit() {
    startTransition(async () => {
      setError(null);
      const payload = {
        name: form.name,
        amount: form.amount,
        currency: form.currency,
        period_start: form.period_start,
        period_end: form.period_end,
        scope_type: form.scope_type,
        scope_value:
          form.scope_type === "global" ? null : form.scope_value || null,
        warning_threshold: Number(form.warning_threshold),
        critical_threshold: Number(form.critical_threshold),
      };

      const response = await fetch(
        editingId ? `/api/budgets/${editingId}` : "/api/budgets",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Could not save budget.");
        return;
      }
      setEditingId(null);
      setForm(emptyForm);
      load();
    });
  }

  function onEdit(budget: BudgetWithSpend) {
    setEditingId(budget.id);
    setForm({
      name: budget.name,
      amount: budget.amount,
      currency: budget.currency,
      period_start: budget.periodStart,
      period_end: budget.periodEnd,
      scope_type: budget.scopeType,
      scope_value: budget.scopeValue ?? "",
      warning_threshold: String(budget.warningThreshold),
      critical_threshold: String(budget.criticalThreshold),
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Could not delete budget.");
        return;
      }
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit budget" : "Create budget"}</CardTitle>
          <CardDescription>
            Monthly global or scoped budgets with warning/critical thresholds
            (defaults 80% / 100%).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Amount">
            <Input
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </Field>
          <Field label="Currency">
            <Input
              value={form.currency}
              maxLength={3}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  currency: e.target.value.toUpperCase(),
                }))
              }
            />
          </Field>
          <Field label="Scope">
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              value={form.scope_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  scope_type: e.target.value as typeof form.scope_type,
                }))
              }
            >
              <option value="global">Global</option>
              <option value="service">Service</option>
              <option value="environment">Environment</option>
              <option value="provider">Provider</option>
            </select>
          </Field>
          {form.scope_type !== "global" ? (
            <Field label="Scope value">
              <Input
                placeholder="e.g. AmazonEC2 or prod"
                value={form.scope_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scope_value: e.target.value }))
                }
              />
            </Field>
          ) : null}
          <Field label="Period start">
            <Input
              type="date"
              value={form.period_start}
              onChange={(e) =>
                setForm((f) => ({ ...f, period_start: e.target.value }))
              }
            />
          </Field>
          <Field label="Period end">
            <Input
              type="date"
              value={form.period_end}
              onChange={(e) =>
                setForm((f) => ({ ...f, period_end: e.target.value }))
              }
            />
          </Field>
          <Field label="Warning %">
            <Input
              value={form.warning_threshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, warning_threshold: e.target.value }))
              }
            />
          </Field>
          <Field label="Critical %">
            <Input
              value={form.critical_threshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, critical_threshold: e.target.value }))
              }
            />
          </Field>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
            <Button type="button" onClick={onSubmit} disabled={isPending}>
              {editingId ? "Save changes" : "Create budget"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className="sm:col-span-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured budgets</CardTitle>
          <CardDescription>
            Spent vs remaining uses imported billing rows in the same currency and
            period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budgets yet.</p>
          ) : (
            budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-lg border border-border px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{budget.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {budget.scopeType}
                      {budget.scopeValue ? ` · ${budget.scopeValue}` : ""} ·{" "}
                      {budget.periodStart} → {budget.periodEnd}
                    </p>
                  </div>
                  <p className="text-sm font-medium capitalize">
                    {budget.spend.status}
                  </p>
                </div>
                <p className="mt-2 text-sm">
                  {formatMoney({
                    amount: budget.spend.spent.toFixed(2),
                    currency: budget.currency,
                  })}{" "}
                  spent of{" "}
                  {formatMoney({
                    amount: budget.amount,
                    currency: budget.currency,
                  })}{" "}
                  ({budget.spend.utilizationPercent.toFixed(1)}%)
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(budget)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(budget.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
