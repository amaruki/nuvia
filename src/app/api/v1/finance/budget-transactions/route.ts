/**
 * GET  /api/v1/finance/budget-transactions — list budget transactions.
 *        Requires finance:read. Filters: type (expense|income|refund),
 *        status (pending|approved|rejected), categoryId. Pagination:
 *        page (1-based) + limit (max 100), conventions-doc meta.
 * POST /api/v1/finance/budget-transactions — record a transaction against a
 *        category. Requires finance:create. Recording with status approved
 *        attributes the approval to the acting user.
 *
 * Amounts are numeric(10,2) string mode (ADR-0015 §5).
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createBudgetTransaction, listBudgetTransactions } from "@/lib/services/budget.service";
import {
  budgetTransactionCreateSchema,
  budgetTransactionListQuerySchema,
} from "@/lib/validation/budget.validation";
import { actorFromRequest, problemFromFinanceError } from "../_lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = budgetTransactionListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { transactions, total } = await listBudgetTransactions(parsed.data);
    return successResponse({
      transactions,
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List budget transactions error"));
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:create");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = budgetTransactionCreateSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const transaction = await createBudgetTransaction(
      parsed.data,
      actorFromRequest(auth.user!.id, request),
    );
    return successResponse({ transaction }, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Record budget transaction error"));
  }
}
