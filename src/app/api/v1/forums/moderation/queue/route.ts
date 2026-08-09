import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { forumProblemFromError, getModerationQueue } from "@/lib/services/forum";

/**
 * GET /api/v1/forums/moderation/queue - Posts awaiting review, with pending report counts
 * Supports page/limit pagination.
 * Requires: forum:moderate permission
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("forum:moderate");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);
    const rawPage = Number.parseInt(searchParams.get("page") ?? "", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    const result = await getModerationQueue({ page, limit });
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
