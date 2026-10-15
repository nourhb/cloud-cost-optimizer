import { NextResponse } from "next/server";
import { evaluateBudgetSpend } from "@/features/budgets";
import {
  createDemoBudget,
  demoUser,
  listDemoBillingRecords,
  listDemoBudgets,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { budgetSchema } from "@/schemas/budget";

export function GET() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Budgets with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const records = listDemoBillingRecords(demoUser.id);
  const budgets = listDemoBudgets(demoUser.id).map((budget) => ({
    ...budget,
    spend: evaluateBudgetSpend(budget, records),
  }));

  return NextResponse.json({ budgets });
}

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Budgets with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid budget payload.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const budget = createDemoBudget(parsed.data, demoUser.id);
  const spend = evaluateBudgetSpend(budget, listDemoBillingRecords(demoUser.id));
  return NextResponse.json({ budget, spend }, { status: 201 });
}
