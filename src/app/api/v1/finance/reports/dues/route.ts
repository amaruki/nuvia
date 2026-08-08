/**
 * GET /api/v1/finance/reports/dues — org-wide dues ledger for the dashboard
 * (C4): every invoice joined to its member and tier with a derived status
 * (pending|partial|paid|overdue|cancelled). Requires finance:read.
 *
 * Derived statuses come from real invoice columns — PAID -> paid,
 * VOID -> cancelled, ISSUED splits on due date / partial payment.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { listDuesLedger } from "@/lib/services/finance-report.service";
import { pageSchema, limitSchema } from "@/lib/validation/finance.validation";
import { problemFromFinanceError } from "../../_lib/helpers";

const duesQuerySchema = z.object({
  status: z.enum(["pending", "partial", "paid", "overdue", "cancelled", "all"]).default("all"),
  page: pageSchema,
  limit: limitSchema,
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = duesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { rows, total } = await listDuesLedger(parsed.data);
    return successResponse({
      rows,
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List dues ledger error"));
  }
}
