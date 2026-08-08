/**
 * GET  /api/v1/finance/invoices — list invoices. Requires finance:read.
 *        Filters: userId, subscriptionId, status (ISSUED|PAID|VOID).
 *        Pagination: page (1-based) + limit (max 100), conventions-doc meta.
 * POST /api/v1/finance/invoices — issue an invoice for a subscription.
 *        Requires finance:create. Omitted items default to one line item at
 *        the tier price.
 *
 * Amounts are numeric(10,2) string mode (ADR-0015 §5).
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createInvoice, listInvoices } from "@/lib/services/invoice.service";
import { createInvoiceSchema, invoiceListQuerySchema } from "@/lib/validation/finance.validation";
import { actorFromRequest, problemFromFinanceError } from "../_lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = invoiceListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { invoices, total } = await listInvoices(parsed.data);
    return successResponse({
      invoices,
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List invoices error"));
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

    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const invoice = await createInvoice(parsed.data, actorFromRequest(auth.user!.id, request));
    return successResponse({ invoice }, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Create invoice error"));
  }
}
