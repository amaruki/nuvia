import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  forumProblemFromError,
  moderatePost,
  moderatePostSchema,
} from "@/lib/services/forum.service";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/forums/moderation/posts/:id - Moderate a post
 * Body: { action: "approve" | "reject" | "hide", reason?: string }
 * approve -> PUBLISHED; reject (reason required) / hide -> HIDDEN
 * Requires: forum:moderate permission
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:moderate");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = moderatePostSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const post = await moderatePost(id, parsed.data, auth.user!);
    return NextResponse.json(successResponse(post));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
