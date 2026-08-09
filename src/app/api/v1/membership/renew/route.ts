/**
 * POST /api/v1/membership/renew — open a renewal checkout (UI-33).
 *
 * Requires a signed-in account (any role); the service verifies the caller
 * holds the subscription LIVE before any provider call — a dead or foreign
 * row is refused with 400 and nothing is leaked. On the manual track the
 * response carries offline-payment guidance only (no new row is created up
 * front on either track — the verified success webhook drives the renewal,
 * ADR-0014). Provider failures surface as 502, never as a success.
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requireRole } from "@/lib/rbac";
import { renewMembershipCheckout } from "@/lib/services/membership-join.service";
import { actorFromRequest, problemFromFunnelError, renewSchema } from "../_lib";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = renewSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await renewMembershipCheckout(
      {
        userId: auth.user!.id,
        subscriptionId: parsed.data.subscriptionId,
        returnUrl: parsed.data.returnUrl ?? `${env.APP_URL}/membership`,
      },
      actorFromRequest(auth.user!.id, request, "Membership renewal checkout"),
    );

    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFunnelError(error, "Start membership renewal"));
  }
}
