/**
 * POST /api/v1/membership/join — start the self-serve join funnel (UI-33).
 *
 * Requires a signed-in account (any role). The service decides the track:
 *  - stripe → creates the subscription + hosted checkout; the response is
 *    "pending" until the verified webhook confirms the charge (never "paid"
 *    optimistically), and `checkoutUrl` is where the member pays.
 *  - manual → no gateway configured; the response carries honest offline
 *    payment guidance, NO subscription row and NO checkout (nothing settles
 *    on its own, paymentStatus stays "unpaid").
 *
 * Provider failures surface as 502 with no charge confirmed — the funnel
 * never fakes a payment success.
 */

import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { env } from "@/lib/env";
import { actorFromRequest, joinSchema, problemFromFunnelError } from "../_lib";
import { joinMembership } from "@/lib/services/membership-join.service";

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

    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await joinMembership(
      {
        userId: auth.user!.id,
        tierId: parsed.data.tierId,
        returnUrl: parsed.data.returnUrl ?? `${env.APP_URL}/membership`,
      },
      actorFromRequest(auth.user!.id, request, "Membership join checkout"),
    );

    return successResponse(result);
  } catch (error) {
    return problemResponse(problemFromFunnelError(error, "Start membership join"));
  }
}
