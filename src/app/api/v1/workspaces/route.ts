/**
 * GET  /api/v1/workspaces — list workspaces (filterable, searchable, paginated)
 * POST /api/v1/workspaces — create a workspace
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createWorkspace,
  createWorkspaceSchema,
  listWorkspaces,
} from "@/lib/services/workspace.service";
import { handleWorkspaceRoute, parsePagination } from "./_lib";

export async function GET(request: NextRequest) {
  return handleWorkspaceRoute(async () => {
    const auth = await requirePermission("workspaces:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listWorkspaces({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      memberRole: searchParams.get("memberRole") ?? undefined,
      createdAfter: searchParams.get("createdAfter") ?? undefined,
      createdBefore: searchParams.get("createdBefore") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/workspaces");
}

export async function POST(request: NextRequest) {
  return handleWorkspaceRoute(async () => {
    const auth = await requirePermission("workspaces:create", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem("validation-error", 422, "Validation failed", "Request body must be valid JSON"),
      );
    }

    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const created = await createWorkspace(parsed.data, auth.user!.id);
    return successResponse(created, undefined, { status: 201 });
  }, "POST /api/v1/workspaces");
}
