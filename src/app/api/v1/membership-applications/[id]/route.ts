/**
 * PATCH /api/v1/membership-applications/[id] — review a membership
 * application (UI-33, decision D10). Requires memberships:approve.
 *
 * Body: `{ decision: "APPROVED" | "REJECTED", reviewNote?: string }`.
 * Approval records the decision only — the membership itself is activated
 * through the subscription backoffice once the offline payment is recorded.
 * Re-reviewing a decided application returns 409; the decision and its
 * auth_logs audit entry land in one transaction.
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { reviewMembershipApplication } from "@/lib/services/membership-join.service";
import { actorFromRequest, problemFromApplicationError, reviewApplicationSchema } from "../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requirePermission("memberships:approve", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = reviewApplicationSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const application = await reviewMembershipApplication(
      id,
      parsed.data.decision,
      parsed.data.reviewNote ?? null,
      actorFromRequest(auth.user!.id, request),
    );

    return successResponse(application);
  } catch (error) {
    return problemResponse(problemFromApplicationError(error, "Review membership application"));
  }
}
