/**
 * POST /api/v1/finance/subscriptions/sweep — run the subscription expiry
 * sweep on demand (treasurer action). Requires finance:update.
 *
 * The same logic runs headless from scripts/sweep-subscriptions.ts on a
 * schedule (issue #15); this route exists so a treasurer can trigger it
 * without shell access and see exactly what moved. Idempotent: rows a
 * concurrent admin action already moved are skipped, not failed.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { sweepExpiredSubscriptions } from "@/lib/services/subscription.service";
import { actorFromRequest, problemFromFinanceError } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:update");
    if (!auth.success) return problemResponse(auth.error!);

    const result = await sweepExpiredSubscriptions(
      actorFromRequest(auth.user!.id, request, "Manual subscription expiry sweep"),
    );
    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "finance/subscriptions/sweep"));
  }
}
