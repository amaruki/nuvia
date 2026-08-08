/**
 * GET /api/v1/finance/reports/invoices — invoice listing for the dashboard
 * (C4): member + tier context and line items included, with dashboard
 * statuses (sent|paid|overdue|cancelled) derived from real invoice columns.
 * Requires finance:read.
 *
 * Complements /api/v1/finance/invoices (C3) which lists raw invoices for
 * API consumers; this variant serves the dashboard's joined view.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { listInvoicesForClient } from "@/lib/services/finance-report.service";
import { pageSchema, limitSchema } from "@/lib/validation/finance.validation";
import { problemFromFinanceError } from "../../_lib/helpers";

const invoicesQuerySchema = z.object({
  status: z.enum(["sent", "paid", "overdue", "cancelled", "all"]).default("all"),
  userId: z.string().min(1).optional(),
  page: pageSchema,
  limit: limitSchema,
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = invoicesQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { rows, total } = await listInvoicesForClient(parsed.data);
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
    return problemResponse(problemFromFinanceError(error, "List dashboard invoices error"));
  }
}
