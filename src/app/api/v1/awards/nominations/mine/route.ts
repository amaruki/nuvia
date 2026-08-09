/**
 * /api/v1/awards/nominations/mine — the authenticated user's own award
 * nominations (backlog UI-36, ring-1). Any signed-in account role may
 * nominate; the admin nominations API at /api/v1/awards/nominations
 * (awards:read / awards:create) is untouched, and members are NOT granted
 * awards:create.
 *
 * GET  — own nominations, newest first.
 * POST — nominate on a program that is OPEN right now. Nominator identity
 *        is forced from the session user, review status always starts
 *        pending, one nomination per member per program.
 */

import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  listOwnNominations,
  submitMemberNomination,
  submitMemberNominationSchema,
} from "@/lib/services/award";
import { handleAwardRoute } from "../../_lib";

export async function GET(request: NextRequest) {
  return handleAwardRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const nominations = await listOwnNominations(auth.user!.id);
    return successResponse(nominations);
  }, "GET /api/v1/awards/nominations/mine");
}

export async function POST(request: NextRequest) {
  return handleAwardRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const json = await request.json();
    const parsed = submitMemberNominationSchema.safeParse(json);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const nomination = await submitMemberNomination(auth.user!.id, parsed.data);
    return successResponse(nomination, undefined, { status: 201 });
  }, "POST /api/v1/awards/nominations/mine");
}
