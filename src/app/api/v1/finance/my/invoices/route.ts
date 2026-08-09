/**
 * GET /api/v1/finance/my/invoices — the signed-in member's own invoice
 * history (UI-34). Requires role user.
 *
 * Own-only filtering happens inside listMemberInvoices (the session user's
 * id goes into the WHERE clause), never in this handler. Projections are
 * allow-lists — see src/lib/services/finance/types.ts.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requireRole } from "@/lib/rbac";
import { listMemberInvoices } from "@/lib/services/finance";
import { memberInvoiceQuerySchema, problemFromMemberFinanceError } from "../_lib";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = memberInvoiceQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { invoices, total } = await listMemberInvoices(auth.user!.id, parsed.data);
    return successResponse(
      { invoices },
      {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    );
  } catch (error) {
    return problemResponse(problemFromMemberFinanceError(error, "List my invoices"));
  }
}
