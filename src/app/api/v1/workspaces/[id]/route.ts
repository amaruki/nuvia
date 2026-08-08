/**
 * GET    /api/v1/workspaces/[id] — fetch one workspace
 * PATCH  /api/v1/workspaces/[id] — update a workspace
 * DELETE /api/v1/workspaces/[id] — delete a workspace
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import {
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
  updateWorkspaceSchema,
} from "@/lib/services/workspace.service";
import { handleWorkspaceRoute } from "../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleWorkspaceRoute(async () => {
    const auth = await requirePermission("workspaces:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const found = await getWorkspace(id);
    if (!found) {
      return problemResponse(problems.notFound("Workspace not found"));
    }
    return successResponse(found);
  }, "GET /api/v1/workspaces/[id]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleWorkspaceRoute(async () => {
    const auth = await requirePermission("workspaces:update", request.headers);
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

    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const updated = await updateWorkspace(id, parsed.data, auth.user!.id);
    return successResponse(updated);
  }, "PATCH /api/v1/workspaces/[id]");
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return handleWorkspaceRoute(async () => {
    const auth = await requirePermission("workspaces:delete", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const deleted = await deleteWorkspace(id);
    if (!deleted) {
      return problemResponse(problems.notFound("Workspace not found"));
    }
    return successResponse({ id, deleted: true });
  }, "DELETE /api/v1/workspaces/[id]");
}
