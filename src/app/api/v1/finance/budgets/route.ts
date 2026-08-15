/**
 * GET  /api/v1/finance/budgets — list budget categories with their derived
 *        spend (spentAmount/remainingAmount/percentageUsed). Requires
 *        finance:read. Pagination: page (1-based) + limit (max 100),
 *        conventions-doc meta.
 * POST /api/v1/finance/budgets — create a budget category. Requires
 *        finance:create.
 *
 * Amounts are numeric(10,2) string mode (ADR-0015 §5).
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createBudgetCategory, listBudgetCategories } from "@/lib/services/budget.service";
import {
  budgetCategoryCreateSchema,
  budgetCategoryListQuerySchema,
} from "@/lib/validation/budget.validation";
import { problemFromFinanceError } from "../_lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = budgetCategoryListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { categories, total } = await listBudgetCategories(parsed.data);
    return successResponse({
      categories,
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List budget categories error"));
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

    const parsed = budgetCategoryCreateSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const category = await createBudgetCategory(parsed.data);
    return successResponse({ category }, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Create budget category error"));
  }
}
