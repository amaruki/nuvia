import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { deleteComment, forumProblemFromError, getComment } from "@/lib/services/forum";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/forums/comments/:id - Get one comment
 * Requires: forum:read permission
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const comment = await getComment(id);
    return NextResponse.json(successResponse(comment));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * DELETE /api/v1/forums/comments/:id - Soft-delete a comment (status -> DELETED)
 * Requires: forum:delete permission
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:delete");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    await deleteComment(id, auth.user!);
    return NextResponse.json(successResponse({ id, deleted: true }));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
