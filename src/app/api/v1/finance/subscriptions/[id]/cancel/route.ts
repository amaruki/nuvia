/**
 * POST /api/v1/finance/subscriptions/[id]/cancel — cancel a subscription.
 * Requires finance:update.
 * Body (all optional): `{ "atPeriodEnd": boolean, "reason": string }`.
 * Immediate cancel moves the row to CANCELED (grace runs to period end per
 * ADR-0014); `atPeriodEnd: true` keeps it running until the period ends.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { cancelSubscription } from "@/lib/services/subscription.service";
import { cancelSubscriptionSchema } from "@/lib/validation/finance.validation";
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

    const parsed = cancelSubscriptionSchema.safeParse(parsedBody.body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await cancelSubscription(
      id,
      actorFromRequest(auth.user!.id, request, parsed.data.reason),
      { atPeriodEnd: parsed.data.atPeriodEnd },
    );
    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Cancel subscription error"));
  }
}
