/**
 * POST /api/v1/finance/my/invoices/[id]/pay — pay-now for one of the
 * signed-in member's own ISSUED invoices (UI-34). Requires role user.
 *
 * Body: `{ returnUrl?: string }` (empty body allowed). Track selection
 * reuses the UI-33 gateway-adapter pattern:
 *  - stripe → hosted checkout for exactly the invoice's outstanding
 *    balance; result stays "pending" until the verified webhook settles.
 *  - manual → honest offline guidance only. No ManualGateway checkout call
 *    (it would settle "completed" instantly and fake a success), no ledger
 *    writes, paymentStatus "unpaid", no fabricated amounts.
 */

import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requireRole } from "@/lib/rbac";
import { payMemberInvoice } from "@/lib/services/finance";
import {
  actorFromRequest,
  parseOptionalJsonBody,
  payNowBodySchema,
  problemFromMemberFinanceError,
} from "../../../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    const parsedBody = await parseOptionalJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = payNowBodySchema.safeParse(parsedBody.body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { id } = await params;
    const result = await payMemberInvoice(
      {
        userId: auth.user!.id,
        invoiceId: id,
        returnUrl: parsed.data.returnUrl ?? `${env.APP_URL}/dashboard/my/finance`,
      },
      actorFromRequest(auth.user!.id, request, "pay-now"),
    );

    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromMemberFinanceError(error, "Pay my invoice"));
  }
}
