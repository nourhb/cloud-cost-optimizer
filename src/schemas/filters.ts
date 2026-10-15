import { z } from "zod";

/** Dashboard / analysis filter query. */
export const billingFiltersSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  provider: z.string().optional(),
  service: z.string().optional(),
  region: z.string().optional(),
  environment: z.string().optional(),
  currency: z.string().length(3).optional(),
});

export type BillingFilters = z.infer<typeof billingFiltersSchema>;
