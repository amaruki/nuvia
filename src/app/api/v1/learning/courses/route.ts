/**
 * GET  /api/v1/learning/courses — list courses (filterable, searchable, paginated)
 * POST /api/v1/learning/courses — create a course
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { createCourseSchema, createCourse, listCourses } from "@/lib/services/learning.service";
import { handleLearningRoute, parsePagination } from "../_lib";

export async function GET(request: NextRequest) {
  return handleLearningRoute(async () => {
    const auth = await requirePermission("learning:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listCourses({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      level: searchParams.get("level") ?? undefined,
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/learning/courses");
}

export async function POST(request: NextRequest) {
  return handleLearningRoute(async () => {
    const auth = await requirePermission("learning:create", request.headers);
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

    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const created = await createCourse(parsed.data, auth.user!.email);
    return successResponse(created, undefined, { status: 201 });
  }, "POST /api/v1/learning/courses");
}
