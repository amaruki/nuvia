/**
 * GET  /api/v1/chapters — list chapters (filterable, searchable, paginated)
 * POST /api/v1/chapters — create a chapter
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { createChapterSchema, createChapter, listChapters } from "@/lib/services/chapter.service";
import { handleChapterRoute, parsePagination } from "./_lib";

export async function GET(request: NextRequest) {
  return handleChapterRoute(async () => {
    const auth = await requirePermission("chapters:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listChapters({
      status: searchParams.get("status") ?? undefined,
      region: searchParams.get("region") ?? undefined,
      country: searchParams.get("country") ?? undefined,
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
  }, "GET /api/v1/chapters");
}

export async function POST(request: NextRequest) {
  return handleChapterRoute(async () => {
    const auth = await requirePermission("chapters:create", request.headers);
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

    const parsed = createChapterSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const created = await createChapter(parsed.data, auth.user!.email);
    return successResponse(created, undefined, { status: 201 });
  }, "POST /api/v1/chapters");
}
