import { NextResponse } from "next/server";
import { evaluateBudgetSpend } from "@/features/budgets";
import { withDataBackend } from "@/lib/api/backend-response";
import { budgetSchema } from "@/schemas/budget";

export async function GET() {
  return withDataBackend(async (backend) => {
    const records = await backend.listBillingRecords();
    const budgets = (await backend.listBudgets()).map((budget) => ({
      ...budget,
      spend: evaluateBudgetSpend(budget, records),
    }));
    return NextResponse.json({ budgets });
  });
}

export async function POST(request: Request) {
  return withDataBackend(async (backend) => {
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

    const budget = await backend.createBudget(parsed.data);
    const spend = evaluateBudgetSpend(
      budget,
      await backend.listBillingRecords(),
    );
    return NextResponse.json({ budget, spend }, { status: 201 });
  });
}
