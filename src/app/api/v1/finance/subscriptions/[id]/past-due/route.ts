/**
 * POST /api/v1/finance/subscriptions/[id]/past-due — mark an ACTIVE/TRIALING
 * subscription PAST_DUE after a failed payment; the grace window starts
 * (ADR-0014 §4). Requires finance:update. Body: optional `{ "reason": string }`.
 *
 * Once the Stripe adapter lands (C3), this transition fires from verified
 * `payment_failed` callbacks; the route stays for treasurer overrides.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { markSubscriptionPastDue } from "@/lib/services/subscription.service";
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

    const result = await markSubscriptionPastDue(
      id,
      actorFromRequest(auth.user!.id, request, parsed.data.reason),
    );
    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Mark past-due error"));
  }
}
