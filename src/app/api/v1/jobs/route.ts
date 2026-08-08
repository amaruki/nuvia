/**
 * GET  /api/v1/jobs — list job postings (filterable, paginated)
 * POST /api/v1/jobs — create a job posting
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { createJobPostingSchema } from "@/lib/services/job.schemas";
import { createJobPosting, listJobPostings } from "@/lib/services/job";
import { handleJobRoute, parsePagination } from "./_lib";

export async function GET(request: NextRequest) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);
    const isFeaturedParam = searchParams.get("isFeatured");

    const result = await listJobPostings({
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      typeId: searchParams.get("typeId") ?? undefined,
      locationId: searchParams.get("locationId") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      isFeatured: isFeaturedParam === null ? undefined : isFeaturedParam === "true",
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/jobs");
}

export async function POST(request: NextRequest) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:create", request.headers);
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

    const parsed = createJobPostingSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const posting = await createJobPosting(parsed.data, auth.user!.id);
    return successResponse(posting, undefined, { status: 201 });
  }, "POST /api/v1/jobs");
}
