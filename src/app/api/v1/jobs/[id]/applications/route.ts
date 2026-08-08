/**
 * GET  /api/v1/jobs/[id]/applications — applications for one posting
 * POST /api/v1/jobs/[id]/applications — apply to a posting
 *
 * Public-submission decision (B6): applications REQUIRE LOGIN. Rationale:
 * job_applications.user_id is a NOT NULL foreign key — an application is
 * inherently account-bound; applicants need an identity to read their own
 * application status later; and authenticated sessions already provide the
 * spam control a rate-limited anonymous endpoint would have to build
 * separately. Any signed-in account role ("user" or higher) may apply.
 */

import type { NextRequest } from "next/server";
import { requirePermission, requireRole } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { createJobApplicationSchema } from "@/lib/services/job.schemas";
import { createApplication, listJobApplications } from "@/lib/services/job.service";
import { handleJobRoute, parsePagination } from "../../_lib";

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
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listJobApplications({
      jobId: id,
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
  }, "GET /api/v1/jobs/[id]/applications");
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return handleJobRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = createJobApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const application = await createApplication(id, auth.user!.id, parsed.data);
    return successResponse(application, undefined, { status: 201 });
  }, "POST /api/v1/jobs/[id]/applications");
}
