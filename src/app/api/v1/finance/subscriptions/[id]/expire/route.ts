/**
 * POST /api/v1/finance/subscriptions/[id]/expire — move a subscription whose
 * entitlement ran out to its terminal state (janitor/treasurer action).
 * Requires finance:update. Body: optional `{ "reason": string }`.
 *
 * Semantics (src/lib/services/subscription/transitions.ts):
 * - stale ACTIVE/TRIALING whose period already ended -> CANCELED,
 * - CANCELED -> grace ends immediately,
 * - PAST_DUE -> UNPAID (retries exhausted; no grace),
 * - refused (409) while still inside a paid period — use cancel instead.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { expireSubscription } from "@/lib/services/subscription.service";
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

    const parsedBody = await parseOptionalJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = lifecycleActionSchema.safeParse(parsedBody.body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await expireSubscription(
      id,
      actorFromRequest(auth.user!.id, request, parsed.data.reason),
    );
    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Expire subscription error"));
  }
}
