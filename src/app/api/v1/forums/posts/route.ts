import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createPost,
  createPostSchema,
  forumProblemFromError,
  listPosts,
  listPostsQuerySchema,
} from "@/lib/services/forum";

/**
 * GET /api/v1/forums/posts - List posts (filters: categoryId, status, authorId, page, limit)
 * Requires: forum:read permission
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("forum:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);
    const parsed = listPostsQuerySchema.safeParse({
      categoryId: searchParams.get("categoryId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      authorId: searchParams.get("authorId") ?? undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const result = await listPosts(parsed.data);
    return NextResponse.json(
      successResponse(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }),
    );
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * POST /api/v1/forums/posts - Create a post
 * Requires: forum:create permission; category role gate applied by the service
 * Requires: forum:read permission for viewing
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("forum:create");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const body = await request.json().catch(() => null);
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const post = await createPost(parsed.data, auth.user!);
    return NextResponse.json(successResponse(post), { status: 201 });
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
