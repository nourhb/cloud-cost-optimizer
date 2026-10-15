/**
 * Manual DB shape aligned with supabase/migrations.
 * Prefer domain types in `@/types/domain` for app code.
 */

export type {
  ProfileRow,
  BillingImportRow,
  BillingRecordRow,
  BudgetRow,
  AlertRow,
  RecommendationRow,
} from "@/lib/supabase/mappers";
