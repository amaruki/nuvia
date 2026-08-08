/**
 * GET   /api/v1/jobs/[id]/applications/[applicationId] — one application
 * PATCH /api/v1/jobs/[id]/applications/[applicationId] — status transition
 *
 * GET is allowed for holders of jobs:read or the applicant themselves.
 * PATCH is allowed for holders of jobs:update/jobs:manage (any valid
 * transition) or the applicant themselves (withdrawal only).
 */

import type { NextRequest } from "next/server";
import { getCurrentUser, hasAnyPermission, requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { updateApplicationStatusSchema } from "@/lib/services/job.schemas";
import { getJobApplication, updateApplicationStatus } from "@/lib/services/job";
import { handleJobRoute } from "../../../_lib";

interface RouteContext {
  params: Promise<{ id: string; applicationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleJobRoute(async () => {
    const { applicationId } = await params;
    const auth = await requirePermission("jobs:read", request.headers);

    if (auth.success) {
      const application = await getJobApplication(applicationId);
      if (!application) {
        return problemResponse(problems.notFound("Job application not found"));
      }
      return successResponse(application);
    }

    // Fallback: applicants may read their own application without jobs:read.
    const currentUser = await getCurrentUser(request.headers);
    if (!currentUser) {
      return problemResponse(problems.authenticationRequired());
    }

    const application = await getJobApplication(applicationId);
    if (!application) {
      return problemResponse(problems.notFound("Job application not found"));
    }
    if (application.userId !== currentUser.id) {
      return problemResponse(auth.error!);
    }
    return successResponse(application);
  }, "GET /api/v1/jobs/[id]/applications/[applicationId]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleJobRoute(async () => {
    const { applicationId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem("validation-error", 422, "Validation failed", "Request body must be valid JSON"),
      );
    }

    const parsed = updateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const auth = await requirePermission("jobs:update", request.headers);
    const privileged = auth.success || (await hasAnyPermission(["jobs:manage"], request.headers));
    const actorUser = auth.user ?? (await getCurrentUser(request.headers));

    if (!actorUser) {
      return problemResponse(problems.authenticationRequired());
    }

    // Non-privileged actors (plain applicants) are restricted to withdrawing
    // their own application by the service layer.
    const application = await updateApplicationStatus(applicationId, parsed.data, {
      id: actorUser.id,
      privileged,
    });
    return successResponse(application);
  }, "PATCH /api/v1/jobs/[id]/applications/[applicationId]");
}
