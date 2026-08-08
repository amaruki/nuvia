/**
 * GET    /api/v1/awards/programs/[id] — fetch one award program
 * PATCH  /api/v1/awards/programs/[id] — update an award program
 * DELETE /api/v1/awards/programs/[id] — delete an award program (nominations cascade)
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import {
  deleteAwardProgram,
  getAwardProgram,
  updateAwardProgram,
  updateAwardProgramSchema,
} from "@/lib/services/award";
import { handleAwardRoute } from "../../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleAwardRoute(async () => {
    const auth = await requirePermission("awards:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const found = await getAwardProgram(id);
    if (!found) {
      return problemResponse(problems.notFound("Award program not found"));
    }
    return successResponse(found);
  }, "GET /api/v1/awards/programs/[id]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleAwardRoute(async () => {
    const auth = await requirePermission("awards:update", request.headers);
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

    const parsed = updateAwardProgramSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const updated = await updateAwardProgram(id, parsed.data, auth.user!.email);
    return successResponse(updated);
  }, "PATCH /api/v1/awards/programs/[id]");
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return handleAwardRoute(async () => {
    const auth = await requirePermission("awards:delete", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const deleted = await deleteAwardProgram(id);
    if (!deleted) {
      return problemResponse(problems.notFound("Award program not found"));
    }
    return successResponse({ id, deleted: true });
  }, "DELETE /api/v1/awards/programs/[id]");
}
