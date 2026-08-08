/**
 * GET  /api/v1/committees — list committees (filterable, paginated)
 * POST /api/v1/committees — create a committee
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  COMMITTEE_AUTHORITY_LEVELS,
  COMMITTEE_ROLES,
  COMMITTEE_STATUSES,
  COMMITTEE_TYPES,
  createCommittee,
  createCommitteeSchema,
  listCommittees,
} from "@/lib/services/committee";
import { handleCommitteeRoute, parseCountParam, parseEnumListParam, parsePagination } from "./_lib";

export async function GET(request: NextRequest) {
  return handleCommitteeRoute(async () => {
    const auth = await requirePermission("committees:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listCommittees({
      status: parseEnumListParam(searchParams, "status", COMMITTEE_STATUSES),
      type: parseEnumListParam(searchParams, "type", COMMITTEE_TYPES),
      authorityLevel: parseEnumListParam(
        searchParams,
        "authorityLevel",
        COMMITTEE_AUTHORITY_LEVELS,
      ),
      leadershipRole: parseEnumListParam(searchParams, "leadershipRole", COMMITTEE_ROLES),
      search: searchParams.get("search")?.trim() || undefined,
      memberCountMin: parseCountParam(searchParams, "memberCountMin"),
      memberCountMax: parseCountParam(searchParams, "memberCountMax"),
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/committees");
}

export async function POST(request: NextRequest) {
  return handleCommitteeRoute(async () => {
    const auth = await requirePermission("committees:create", request.headers);
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

    const parsed = createCommitteeSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const created = await createCommittee(parsed.data, auth.user!.id);
    return successResponse(created, undefined, { status: 201 });
  }, "POST /api/v1/committees");
}
