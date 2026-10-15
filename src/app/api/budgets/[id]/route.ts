import { NextResponse } from "next/server";
import { evaluateBudgetSpend } from "@/features/budgets";
import { withDataBackend } from "@/lib/api/backend-response";
import { budgetSchema } from "@/schemas/budget";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withDataBackend(async (backend) => {
    const { id } = await context.params;
    const budget = await backend.getBudget(id);
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    return NextResponse.json({
      budget,
      spend: evaluateBudgetSpend(budget, await backend.listBillingRecords()),
    });
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return withDataBackend(async (backend) => {
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

    const budget = await backend.updateBudget(id, parsed.data);
    if (!budget) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }

    return NextResponse.json({
      budget,
      spend: evaluateBudgetSpend(budget, await backend.listBillingRecords()),
    });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withDataBackend(async (backend) => {
    const { id } = await context.params;
    const deleted = await backend.deleteBudget(id);
    if (!deleted) {
      return NextResponse.json({ message: "Budget not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
