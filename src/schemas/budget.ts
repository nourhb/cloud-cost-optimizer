import { z } from "zod";

/** Budget payload schema — persistence arrives in M5. */
export const budgetSchema = z.object({
  name: z.string().min(1).max(120),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  currency: z.string().length(3),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope_type: z.enum(["global", "service", "environment", "provider"]),
  scope_value: z.string().nullable(),
  warning_threshold: z.number().min(0).max(100).default(80),
  critical_threshold: z.number().min(0).max(100).default(100),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
