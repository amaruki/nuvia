import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import { getMemberDetail } from "@/lib/services/member.service";

/**
 * GET /api/v1/members/[id] — member detail with subscription history
 * (backlog B1).
 * Requires: users:read
 *
 * Permission mapping for the members API (documented per backlog B1):
 * - The listing (`/api/v1/members`) uses `memberships:read` — a
 *   membership-flavored directory.
 * - This detail endpoint uses `users:read`, because the item exposes
 *   user-management data (email, username, verification state, role) in
 *   addition to the subscription history.
 *
 * Member status is never stored — it is derived per ADR-0014 by the member
 * service through `deriveMemberStatus`.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await requirePermission("users:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const detail = await getMemberDetail(id);
    return successResponse(detail);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return problemResponse(problems.notFound(error.message));
    }
    logger.error("Failed to load member detail", error);
    return problemResponse(problems.internalError("Failed to load member"));
  }
}
