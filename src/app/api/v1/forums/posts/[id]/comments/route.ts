import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createComment,
  createCommentSchema,
  forumProblemFromError,
  listComments,
} from "@/lib/services/forum";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/forums/posts/:id/comments - List comments on a post
 * Requires: forum:read permission
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const comments = await listComments(id);
    return NextResponse.json(successResponse(comments));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * POST /api/v1/forums/posts/:id/comments - Add a comment to a post
 * Requires: forum:create permission; category role gate applied by the service
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:create");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const comment = await createComment(id, parsed.data, auth.user!);
    return NextResponse.json(successResponse(comment), { status: 201 });
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
