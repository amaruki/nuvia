/**
 * POST /api/v1/finance/payments — record a manual (treasurer) payment
 *        against an ISSUED invoice. Requires finance:create. Rejects
 *        overpayment and payments against PAID/VOID invoices (409).
 * GET  /api/v1/finance/payments — list recorded payments. Requires
 *        finance:read. Filters: invoiceId, userId, subscriptionId;
 *        page/limit pagination with conventions-doc meta.
 *
 * Each recorded payment writes its membership_transactions ledger row in
 * the same db.transaction (C3 / ADR-0015 §5).
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { listPayments, recordPayment } from "@/lib/services/payment.service";
import { paymentListQuerySchema, recordPaymentSchema } from "@/lib/validation/finance.validation";
import { actorFromRequest, problemFromFinanceError } from "../_lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = paymentListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { payments, total } = await listPayments(parsed.data);
    return successResponse({
      payments,
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List payments error"));
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

    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await recordPayment(parsed.data, actorFromRequest(auth.user!.id, request));
    return successResponse(result, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Record payment error"));
  }
}
