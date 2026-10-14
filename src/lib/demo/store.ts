/**
 * In-memory demo fixtures for NEXT_PUBLIC_DEMO_MODE=true.
 * No persistence; no Supabase. Used only for empty-state shell UX in M1.
 */

export type DemoUser = {
  id: string;
  email: string;
  displayName: string;
  preferredCurrency: string;
};

export const demoUser: DemoUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@example.com",
  displayName: "Demo User",
  preferredCurrency: "CAD",
};

export function getDemoImportHistory(): never[] {
  return [];
}

export function getDemoBillingSummary() {
  return {
    totalCost: null,
    currency: demoUser.preferredCurrency,
    periodLabel: "No data yet",
    message: "Import a billing CSV to populate the dashboard.",
  };
}
