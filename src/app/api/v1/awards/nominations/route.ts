/**
 * GET  /api/v1/awards/nominations — list nominations (filterable, searchable, paginated)
 * POST /api/v1/awards/nominations — create a nomination
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createAwardNomination,
  createAwardNominationSchema,
  listAwardNominations,
} from "@/lib/services/award";
import { handleAwardRoute, parsePagination } from "../_lib";

export async function GET(request: NextRequest) {
  return handleAwardRoute(async () => {
    const auth = await requirePermission("awards:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listAwardNominations({
      status: searchParams.get("status") ?? undefined,
      programId: searchParams.get("programId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/awards/nominations");
}

export async function POST(request: NextRequest) {
  return handleAwardRoute(async () => {
    const auth = await requirePermission("awards:create", request.headers);
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

    const parsed = createAwardNominationSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const created = await createAwardNomination(parsed.data, auth.user!.email);
    return successResponse(created, undefined, { status: 201 });
  }, "POST /api/v1/awards/nominations");
}
