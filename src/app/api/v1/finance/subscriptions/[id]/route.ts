/**
 * GET /api/v1/finance/subscriptions/[id] — read one subscription, plus the
 * member status the A3 derivation computes for it right now. Requires
 * finance:read.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { deriveMemberStatus } from "@/lib/services/membership-status.service";
import { getSubscription } from "@/lib/services/subscription.service";
import { problemFromFinanceError } from "../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const subscription = await getSubscription(id);
    return successResponse({
      subscription,
      memberStatus: deriveMemberStatus(subscription, new Date()),
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Get subscription error"));
  }
}
