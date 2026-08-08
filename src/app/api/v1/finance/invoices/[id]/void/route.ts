/**
 * POST /api/v1/finance/invoices/:id/void — void an ISSUED invoice.
 * Requires finance:update. Optional body: { reason } for the audit trail.
 *
 * 409 when the invoice is already PAID or VOID; 404 when unknown.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { voidInvoice } from "@/lib/services/invoice.service";
import { lifecycleActionSchema } from "@/lib/validation/finance.validation";
import {
  actorFromRequest,
  parseOptionalJsonBody,
  problemFromFinanceError,
} from "../../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:update");
    if (!auth.success) return problemResponse(auth.error!);

    const bodyResult = await parseOptionalJsonBody(request);
    if (!bodyResult.ok) return bodyResult.response;

    const parsed = lifecycleActionSchema.safeParse(bodyResult.body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const invoice = await voidInvoice(
      id,
      actorFromRequest(auth.user!.id, request, parsed.data.reason),
    );
    return successResponse({ invoice });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Void invoice error"));
  }
}
