import { z } from "zod";

/** Expected CSV columns (CDC §4.2). Parsing logic arrives in M3. */
export const billingCsvRowSchema = z.object({
  billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  provider: z.string().min(1),
  service: z.string().min(1),
  region: z.string().min(1),
  resource_id: z.string().min(1),
  usage_quantity: z.string().min(1),
  usage_unit: z.string().min(1),
  cost: z.string().min(1),
  currency: z.string().length(3),
  environment: z.string().min(1),
});

export type BillingCsvRow = z.infer<typeof billingCsvRowSchema>;

export const BILLING_CSV_COLUMNS = [
  "billing_date",
  "provider",
  "service",
  "region",
  "resource_id",
  "usage_quantity",
  "usage_unit",
  "cost",
  "currency",
  "environment",
] as const;
