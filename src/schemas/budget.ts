import { z } from "zod";

/** Budget create/update payload (CDC §4.5). */
export const budgetSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    amount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,6})?$/, "Amount must be a positive decimal"),
    currency: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .pipe(z.string().length(3)),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scope_type: z.enum(["global", "service", "environment", "provider"]),
    scope_value: z.string().trim().nullable().optional(),
    warning_threshold: z.coerce.number().min(0).max(100).default(80),
    critical_threshold: z.coerce.number().min(0).max(100).default(100),
  })
  .superRefine((data, ctx) => {
    if (data.period_end < data.period_start) {
      ctx.addIssue({
        code: "custom",
        path: ["period_end"],
        message: "period_end must be on or after period_start",
      });
    }
    if (Number(data.amount) <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount must be greater than zero",
      });
    }
    if (data.critical_threshold < data.warning_threshold) {
      ctx.addIssue({
        code: "custom",
        path: ["critical_threshold"],
        message: "critical_threshold must be ≥ warning_threshold",
      });
    }
    if (data.scope_type !== "global" && !data.scope_value) {
      ctx.addIssue({
        code: "custom",
        path: ["scope_value"],
        message: "scope_value is required when scope_type is not global",
      });
    }
  });

export type BudgetInput = z.infer<typeof budgetSchema>;
