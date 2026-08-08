/**
 * GET    /api/v1/jobs/[id] — fetch one posting
 * PATCH  /api/v1/jobs/[id] — update a posting
 * DELETE /api/v1/jobs/[id] — delete a posting (and its applications)
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { updateJobPostingSchema } from "@/lib/services/job.schemas";
import { deleteJobPosting, getJobPosting, updateJobPosting } from "@/lib/services/job.service";
import { handleJobRoute } from "../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const posting = await getJobPosting(id);
    if (!posting) {
      return problemResponse(problems.notFound("Job posting not found"));
    }
    return successResponse(posting);
  }, "GET /api/v1/jobs/[id]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:update", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem("validation-error", 422, "Validation failed", "Request body must be valid JSON"),
      );
    }

    const parsed = updateJobPostingSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const posting = await updateJobPosting(id, parsed.data);
    return successResponse(posting);
  }, "PATCH /api/v1/jobs/[id]");
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return handleJobRoute(async () => {
    const auth = await requirePermission("jobs:delete", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const deleted = await deleteJobPosting(id);
    if (!deleted) {
      return problemResponse(problems.notFound("Job posting not found"));
    }
    return successResponse({ id, deleted: true });
  }, "DELETE /api/v1/jobs/[id]");
}
