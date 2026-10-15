import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateAlerts } from "@/features/alerts/evaluate";
import { buildDedupeKey } from "@/features/imports/dedupe";
import { detectCurrencyMode } from "@/features/imports/preview";
import { evaluateRecommendations } from "@/features/recommendations/rules";
import type { DataBackend, SessionUser } from "@/lib/data/types";
import {
  mapAlert,
  mapBudget,
  mapImport,
  mapRecommendation,
  mapRecord,
  type AlertRow,
  type BillingImportRow,
  type BillingRecordRow,
  type BudgetRow,
  type ProfileRow,
  type RecommendationRow,
} from "@/lib/supabase/mappers";
import type { BudgetInput } from "@/schemas/budget";
import type { ParsedBillingRow } from "@/types/domain";

async function loadUser(
  supabase: SupabaseClient,
  userId: string,
  email: string,
): Promise<SessionUser> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, preferred_currency")
    .eq("id", userId)
    .maybeSingle();

  const profile = data as ProfileRow | null;
  return {
    id: userId,
    email: profile?.email ?? email,
    displayName:
      profile?.display_name ?? email.split("@")[0] ?? "User",
    preferredCurrency: profile?.preferred_currency ?? "CAD",
  };
}

export async function createSupabaseBackend(
  supabase: SupabaseClient,
  authUser: { id: string; email?: string | null },
): Promise<DataBackend> {
  const user = await loadUser(
    supabase,
    authUser.id,
    authUser.email ?? "user@example.com",
  );
  const userId = user.id;

  async function refreshInsights(importId: string | null = null) {
    const [{ data: recordRows }, { data: budgetRows }] = await Promise.all([
      supabase.from("billing_records").select("*").eq("user_id", userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
    ]);

    const records = ((recordRows ?? []) as BillingRecordRow[]).map(mapRecord);
    const budgets = ((budgetRows ?? []) as BudgetRow[]).map(mapBudget);
    const now = new Date().toISOString();

    await supabase
      .from("alerts")
      .delete()
      .eq("user_id", userId)
      .eq("status", "open");
    await supabase
      .from("recommendations")
      .delete()
      .eq("user_id", userId)
      .eq("status", "active");

    const evaluatedAlerts = evaluateAlerts({ records, budgets, importId });
    if (evaluatedAlerts.length > 0) {
      const { error } = await supabase.from("alerts").insert(
        evaluatedAlerts.map((alert) => ({
          id: randomUUID(),
          user_id: userId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          status: "open",
          trigger_data: alert.triggerData,
          recommended_action: alert.recommendedAction,
          related_budget_id: alert.relatedBudgetId,
          import_id: alert.importId,
          created_at: now,
          resolved_at: null,
        })),
      );
      if (error) {
        throw new Error(`Failed to save alerts: ${error.message}`);
      }
    }

    const evaluatedRecs = evaluateRecommendations({
      records,
      budgets,
      importId,
    });
    if (evaluatedRecs.length > 0) {
      const { error } = await supabase.from("recommendations").insert(
        evaluatedRecs.map((item) => ({
          id: randomUUID(),
          user_id: userId,
          category: item.category,
          title: item.title,
          description: item.description,
          evidence: item.evidence,
          proposed_action: item.proposedAction,
          estimated_savings: item.estimatedSavings,
          estimated_savings_currency: item.estimatedSavingsCurrency,
          limitations: item.limitations,
          status: "active",
          import_id: item.importId,
          created_at: now,
        })),
      );
      if (error) {
        throw new Error(`Failed to save recommendations: ${error.message}`);
      }
    }

    const [{ data: alerts }, { data: recommendations }] = await Promise.all([
      supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    return {
      alerts: ((alerts ?? []) as AlertRow[]).map(mapAlert),
      recommendations: ((recommendations ?? []) as RecommendationRow[]).map(
        mapRecommendation,
      ),
    };
  }

  return {
    kind: "supabase",
    user,
    async listImports() {
      const { data, error } = await supabase
        .from("billing_imports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return ((data ?? []) as BillingImportRow[]).map(mapImport);
    },
    async getImport(id) {
      const { data, error } = await supabase
        .from("billing_imports")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapImport(data as BillingImportRow) : null;
    },
    async getImportPending(id) {
      const { data, error } = await supabase
        .from("billing_imports")
        .select("preview_rows")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      const rows = (data as { preview_rows: ParsedBillingRow[] | null } | null)
        ?.preview_rows;
      return rows ?? null;
    },
    async createImportPreview(input) {
      const { currencyMode, primaryCurrency } = detectCurrencyMode(
        input.accepted,
      );
      const now = new Date().toISOString();
      const id = randomUUID();
      const row = {
        id,
        user_id: userId,
        filename: input.filename,
        status: "previewed" as const,
        rows_processed: input.accepted.length,
        rows_rejected: input.rejected.length,
        rows_duplicated: 0,
        currency_mode: currencyMode,
        primary_currency: primaryCurrency,
        error_summary:
          input.rejected.length > 0 ? { rejections: input.rejected } : null,
        preview_rows: input.accepted,
        created_at: now,
        committed_at: null,
      };
      const { data, error } = await supabase
        .from("billing_imports")
        .insert(row)
        .select("*")
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return mapImport(data as BillingImportRow);
    },
    async markImportFailed(id, message) {
      const { data, error } = await supabase
        .from("billing_imports")
        .update({
          status: "failed",
          error_summary: {
            rejections: [{ rowNumber: 0, message }],
          },
          preview_rows: null,
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapImport(data as BillingImportRow) : null;
    },
    async commitImport(id) {
      const { data: importRow, error: importError } = await supabase
        .from("billing_imports")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (importError) {
        throw new Error(importError.message);
      }
      if (!importRow) {
        return null;
      }
      const typed = importRow as BillingImportRow;
      if (typed.status !== "previewed" || !typed.preview_rows) {
        return null;
      }

      const pending = typed.preview_rows;
      const { data: existingKeys } = await supabase
        .from("billing_records")
        .select("dedupe_key")
        .eq("user_id", userId);

      const known = new Set(
        ((existingKeys ?? []) as { dedupe_key: string }[]).map(
          (row) => row.dedupe_key,
        ),
      );

      let inserted = 0;
      let duplicated = 0;
      const now = new Date().toISOString();
      const toInsert: Record<string, unknown>[] = [];

      for (const row of pending) {
        const dedupeKey = buildDedupeKey(userId, row);
        if (known.has(dedupeKey)) {
          duplicated += 1;
          continue;
        }
        known.add(dedupeKey);
        toInsert.push({
          id: randomUUID(),
          user_id: userId,
          import_id: id,
          billing_date: row.billingDate,
          provider: row.provider,
          service: row.service,
          region: row.region,
          resource_id: row.resourceId,
          usage_quantity: row.usageQuantity,
          usage_unit: row.usageUnit,
          cost: row.cost,
          currency: row.currency,
          environment: row.environment,
          dedupe_key: dedupeKey,
          created_at: now,
        });
        inserted += 1;
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("billing_records").insert(toInsert);
        if (error) {
          throw new Error(error.message);
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from("billing_imports")
        .update({
          status: "committed",
          rows_processed: inserted,
          rows_duplicated: duplicated,
          committed_at: now,
          preview_rows: null,
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (updateError) {
        throw new Error(updateError.message);
      }

      await refreshInsights(id);

      return {
        import: mapImport(updated as BillingImportRow),
        inserted,
        duplicated,
      };
    },
    async listBillingRecords() {
      const { data, error } = await supabase
        .from("billing_records")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
      return ((data ?? []) as BillingRecordRow[]).map(mapRecord);
    },
    async listBudgets() {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return ((data ?? []) as BudgetRow[]).map(mapBudget);
    },
    async getBudget(id) {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapBudget(data as BudgetRow) : null;
    },
    async createBudget(input: BudgetInput) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          id: randomUUID(),
          user_id: userId,
          name: input.name,
          amount: input.amount,
          currency: input.currency,
          period_start: input.period_start,
          period_end: input.period_end,
          scope_type: input.scope_type,
          scope_value:
            input.scope_type === "global" ? null : (input.scope_value ?? null),
          warning_threshold: input.warning_threshold,
          critical_threshold: input.critical_threshold,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();
      if (error) {
        throw new Error(error.message);
      }
      await refreshInsights();
      return mapBudget(data as BudgetRow);
    },
    async updateBudget(id, input) {
      const { data, error } = await supabase
        .from("budgets")
        .update({
          name: input.name,
          amount: input.amount,
          currency: input.currency,
          period_start: input.period_start,
          period_end: input.period_end,
          scope_type: input.scope_type,
          scope_value:
            input.scope_type === "global" ? null : (input.scope_value ?? null),
          warning_threshold: input.warning_threshold,
          critical_threshold: input.critical_threshold,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        return null;
      }
      await refreshInsights();
      return mapBudget(data as BudgetRow);
    },
    async deleteBudget(id) {
      const { data, error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");
      if (error) {
        throw new Error(error.message);
      }
      const deleted = (data?.length ?? 0) > 0;
      if (deleted) {
        await refreshInsights();
      }
      return deleted;
    },
    async listAlerts() {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return ((data ?? []) as AlertRow[]).map(mapAlert);
    },
    async acknowledgeAlert(id) {
      const { data, error } = await supabase
        .from("alerts")
        .update({ status: "acknowledged" })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return data ? mapAlert(data as AlertRow) : null;
    },
    async listRecommendations() {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return ((data ?? []) as RecommendationRow[]).map(mapRecommendation);
    },
    refreshInsights,
  };
}
