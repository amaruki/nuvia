/**
 * GET /api/v1/finance/payments/:id — one recorded payment. Requires
 * finance:read.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { getPayment } from "@/lib/services/payment.service";
import { problemFromFinanceError } from "../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const payment = await getPayment(id);
    return successResponse({ payment });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Get payment error"));
  }
}
