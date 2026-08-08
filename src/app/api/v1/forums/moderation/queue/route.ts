import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { forumProblemFromError, getModerationQueue } from "@/lib/services/forum";

/**
 * GET /api/v1/forums/moderation/queue - Posts awaiting review, with pending report counts
 * Requires: forum:moderate permission
 */
export async function GET() {
  try {
    const auth = await requirePermission("forum:moderate");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const queue = await getModerationQueue();
    return NextResponse.json(successResponse(queue));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
