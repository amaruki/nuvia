/**
 * GET    /api/v1/committees/[id] — fetch one committee
 * PATCH  /api/v1/committees/[id] — update a committee
 * DELETE /api/v1/committees/[id] — delete a committee (members cascade)
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import {
  deleteCommittee,
  getCommittee,
  updateCommittee,
  updateCommitteeSchema,
} from "@/lib/services/committee";
import { handleCommitteeRoute } from "../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleCommitteeRoute(async () => {
    const auth = await requirePermission("committees:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const committee = await getCommittee(id);
    return successResponse(committee);
  }, "GET /api/v1/committees/[id]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleCommitteeRoute(async () => {
    const auth = await requirePermission("committees:update", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem("validation-error", 422, "Validation failed", "Request body must be valid JSON"),
      );
    }

    const parsed = updateCommitteeSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const updated = await updateCommittee(id, parsed.data, auth.user!.id);
    return successResponse(updated);
  }, "PATCH /api/v1/committees/[id]");
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return handleCommitteeRoute(async () => {
    const auth = await requirePermission("committees:delete", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const deleted = await deleteCommittee(id);
    if (!deleted) {
      return problemResponse(problems.notFound("Committee not found"));
    }
    return successResponse({ id, deleted: true });
  }, "DELETE /api/v1/committees/[id]");
}
