import { NextResponse } from "next/server";
import { evaluateBudgetSpend } from "@/features/budgets";
import {
  deleteDemoBudget,
  demoUser,
  getDemoBudget,
  listDemoBillingRecords,
  updateDemoBudget,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { budgetSchema } from "@/schemas/budget";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Budgets with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const { id } = await context.params;
  const budget = getDemoBudget(id, demoUser.id);
  if (!budget) {
    return NextResponse.json({ message: "Budget not found." }, { status: 404 });
  }

  return NextResponse.json({
    budget,
    spend: evaluateBudgetSpend(budget, listDemoBillingRecords(demoUser.id)),
  });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Budgets with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const { id } = await context.params;
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

  const budget = updateDemoBudget(id, parsed.data, demoUser.id);
  if (!budget) {
    return NextResponse.json({ message: "Budget not found." }, { status: 404 });
  }

  return NextResponse.json({
    budget,
    spend: evaluateBudgetSpend(budget, listDemoBillingRecords(demoUser.id)),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { message: "Budgets with Supabase are not wired yet." },
      { status: 501 },
    );
  }

  const { id } = await context.params;
  const deleted = deleteDemoBudget(id, demoUser.id);
  if (!deleted) {
    return NextResponse.json({ message: "Budget not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
