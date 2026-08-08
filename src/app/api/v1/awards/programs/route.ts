/**
 * GET  /api/v1/awards/programs — list award programs (filterable, searchable, paginated)
 * POST /api/v1/awards/programs — create an award program
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createAwardProgram,
  createAwardProgramSchema,
  listAwardPrograms,
} from "@/lib/services/award.service";
import { handleAwardRoute, parsePagination } from "../_lib";

export async function GET(request: NextRequest) {
  return handleAwardRoute(async () => {
    const auth = await requirePermission("awards:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listAwardPrograms({
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
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
  }, "GET /api/v1/awards/programs");
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

    const parsed = createAwardProgramSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const created = await createAwardProgram(parsed.data, auth.user!.email);
    return successResponse(created, undefined, { status: 201 });
  }, "POST /api/v1/awards/programs");
}
