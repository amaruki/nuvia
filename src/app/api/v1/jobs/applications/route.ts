/**
 * GET /api/v1/jobs/applications — list applications across postings.
 * Filters: ?jobId=&status=&page=&limit=.
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { listJobApplications } from "@/lib/services/job";
import { handleJobRoute, parsePagination } from "../_lib";

export async function GET(request: NextRequest) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listJobApplications({
      jobId: searchParams.get("jobId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/jobs/applications");
}
