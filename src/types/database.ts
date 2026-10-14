/**
 * Manual DB shape aligned with supabase/migrations (M1 stubs).
 * Generated types can replace this once Supabase is connected (M2+).
 */

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
};

export type BillingImportRow = {
  id: string;
  user_id: string;
  filename: string;
  status: "pending" | "previewed" | "committed" | "failed";
  rows_processed: number;
  rows_rejected: number;
  rows_duplicated: number;
  currency_mode: "single" | "separated";
  primary_currency: string | null;
  error_summary: Record<string, unknown> | null;
  created_at: string;
  committed_at: string | null;
};
