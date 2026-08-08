/**
 * GET /api/v1/jobs/applications/mine — the authenticated user's own
 * applications. Any signed-in account role may read their own list.
 */

import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { listApplicationsForUser } from "@/lib/services/job.service";
import { handleJobRoute } from "../../_lib";

export async function GET(request: NextRequest) {
  return handleJobRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const applications = await listApplicationsForUser(auth.user!.id);
    return successResponse(applications);
  }, "GET /api/v1/jobs/applications/mine");
}
