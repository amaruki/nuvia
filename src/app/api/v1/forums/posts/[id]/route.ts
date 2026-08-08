import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  deletePost,
  forumProblemFromError,
  getPost,
  updatePost,
  updatePostSchema,
} from "@/lib/services/forum";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/forums/posts/:id - Get one post with author and category
 * Requires: forum:read permission
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const post = await getPost(id);
    return NextResponse.json(successResponse(post));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * PATCH /api/v1/forums/posts/:id - Update a post
 * Requires: forum:update permission
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:update");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const post = await updatePost(id, parsed.data, auth.user!);
    return NextResponse.json(successResponse(post));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * DELETE /api/v1/forums/posts/:id - Soft-delete a post (status -> DELETED)
 * Requires: forum:delete permission
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:delete");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    await deletePost(id, auth.user!);
    return NextResponse.json(successResponse({ id, deleted: true }));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
