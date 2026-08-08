/**
 * GET /api/v1/finance/invoices/:id — one invoice with its line items.
 * Requires finance:read.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { getInvoice } from "@/lib/services/invoice.service";
import { problemFromFinanceError } from "../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const invoice = await getInvoice(id);
    return successResponse({ invoice });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Get invoice error"));
  }
}
