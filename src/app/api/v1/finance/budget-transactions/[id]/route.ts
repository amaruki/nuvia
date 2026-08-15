/**
 * GET   /api/v1/finance/budget-transactions/:id — one transaction.
 *       Requires finance:read.
 * PATCH /api/v1/finance/budget-transactions/:id — update status and/or
 *       notes. Requires finance:update. Approving records the acting user
 *       and timestamp; pending/rejected clears them. 404 when unknown.
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { getBudgetTransaction, updateBudgetTransaction } from "@/lib/services/budget.service";
import { budgetTransactionUpdateSchema } from "@/lib/validation/budget.validation";
import { actorFromRequest, problemFromFinanceError } from "../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const transaction = await getBudgetTransaction(id);
    return successResponse({ transaction });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Get budget transaction error"));
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:update");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = budgetTransactionUpdateSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const transaction = await updateBudgetTransaction(
      id,
      parsed.data,
      actorFromRequest(auth.user!.id, request),
    );
    return successResponse({ transaction });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Update budget transaction error"));
  }
}
