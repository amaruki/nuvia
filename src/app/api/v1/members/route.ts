import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { listMembers } from "@/lib/services/member.service";

/**
 * GET /api/v1/members — member directory listing (backlog B1).
 * Requires: memberships:read
 *
 * Permission mapping for the members API (documented per backlog B1):
 * - This listing uses `memberships:read` — it is a membership-flavored
 *   directory (user row + newest subscription + derived member status).
 * - The detail endpoint `/api/v1/members/[id]` uses `users:read`, because
 *   that item additionally exposes user-management data (email, username,
 *   verification state, role) alongside subscription history.
 *
 * Member status is never stored — it is derived per ADR-0014 by the member
 * service through `deriveMemberStatus`.
 */

const MEMBER_STATUSES = ["active", "trialing", "in_grace", "paused", "expired", "none"] as const;

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  role: z.array(z.string().min(1)),
  memberStatus: z.array(z.enum(MEMBER_STATUSES)),
  sortBy: z.enum(["name", "username", "email", "role", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("memberships:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      role: searchParams.getAll("role"),
      memberStatus: searchParams.getAll("memberStatus"),
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    });
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const result = await listMembers({
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
      roles: parsed.data.role,
      memberStatuses: parsed.data.memberStatus,
      sortBy: parsed.data.sortBy,
      sortOrder: parsed.data.sortOrder,
    });

    const { members, ...pagination } = result;
    return successResponse({ members }, pagination);
  } catch (error) {
    logger.error("Failed to list members", error);
    return problemResponse(problems.internalError("Failed to list members"));
  }
}
