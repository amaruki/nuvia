/**
 * GET  /api/v1/finance/subscriptions — list subscriptions. Requires finance:read.
 *        Filters: `userId`, `status`, `tierId`, `limit` (≤200), `offset`.
 * POST /api/v1/finance/subscriptions — create a subscription on an active
 *        tier. Requires finance:create. Runs the A3 member-status sync, so
 *        the user's role is promoted in the same request.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createSubscription, listSubscriptions } from "@/lib/services/subscription.service";
import { createSubscriptionSchema } from "@/lib/validation/finance.validation";
import { actorFromRequest, problemFromFinanceError } from "../_lib/helpers";

const listQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "TRIALING", "CANCELED", "PAST_DUE", "UNPAID", "PAUSED"]).optional(),
  tierId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const subscriptions = await listSubscriptions(parsed.data);
    return successResponse({ subscriptions, total: subscriptions.length });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List subscriptions error"));
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

    const parsed = createSubscriptionSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await createSubscription(parsed.data, actorFromRequest(auth.user!.id, request));
    return successResponse(result, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Create subscription error"));
  }
}
