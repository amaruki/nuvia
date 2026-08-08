/**
 * GET /api/v1/jobs/meta — reference data (categories, types, locations,
 * companies) for job form dropdowns.
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { getJobBoardMeta } from "@/lib/services/job.service";
import { handleJobRoute } from "../_lib";

export async function GET(request: NextRequest) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const meta = await getJobBoardMeta();
    return successResponse(meta);
  }, "GET /api/v1/jobs/meta");
}
