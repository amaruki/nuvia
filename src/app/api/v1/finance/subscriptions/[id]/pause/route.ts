/**
 * POST /api/v1/finance/subscriptions/[id]/pause — pause an ACTIVE
 * subscription. Requires finance:update. Body: optional `{ "reason": string }`.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { pauseSubscription } from "@/lib/services/subscription.service";
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

    const result = await pauseSubscription(
      id,
      actorFromRequest(auth.user!.id, request, parsed.data.reason),
    );
    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Pause subscription error"));
  }
}
