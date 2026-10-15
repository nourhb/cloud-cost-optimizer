import { z } from "zod";
import { isValidIsoDate } from "@/lib/dates";

/** Expected CSV columns (CDC §4.2). */
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

export type BillingCsvColumn = (typeof BILLING_CSV_COLUMNS)[number];

const decimalString = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?$/, "Must be a valid number");

export const billingCsvRowSchema = z.object({
  billing_date: z
    .string()
    .trim()
    .refine(isValidIsoDate, "Must be a valid ISO date (YYYY-MM-DD)"),
  provider: z.string().trim().min(1, "Provider is required"),
  service: z.string().trim().min(1, "Service is required"),
  region: z.string().trim().min(1, "Region is required"),
  resource_id: z.string().trim().min(1, "Resource ID is required"),
  usage_quantity: decimalString,
  usage_unit: z.string().trim().min(1, "Usage unit is required"),
  cost: decimalString,
  currency: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().length(3, "Currency must be a 3-letter ISO code")),
  environment: z.string().trim().min(1, "Environment is required"),
});

export type BillingCsvRow = z.infer<typeof billingCsvRowSchema>;

/** Raw row shape after Papa Parse (all string values). */
export const billingCsvRawRowSchema = z.record(z.string(), z.unknown());
