/**
 * Membership application track of the join funnel (UI-33, decision D10).
 *
 * GET  /api/v1/membership-applications — backoffice queue. Requires
 *        memberships:read. Filters: `status`; paginates with `page`/`limit`.
 * POST /api/v1/membership-applications — a signed-in member applies for a
 *        tier (any authenticated role). Duplicate pending applications for
 *        the same tier + applicant (account OR contact email) return 409.
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission, requireRole } from "@/lib/rbac";
import {
  createMembershipApplication,
  listMembershipApplications,
} from "@/lib/services/membership-join.service";
import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  problemFromApplicationError,
} from "./_lib";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("memberships:read", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = listApplicationsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { items, total } = await listMembershipApplications(parsed.data);
    const { page, limit } = parsed.data;
    return successResponse(items, {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return problemResponse(problemFromApplicationError(error, "List membership applications"));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Applying only needs a signed-in account — no membership permissions.
    const auth = await requireRole("user", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const application = await createMembershipApplication({
      userId: auth.user!.id,
      tierId: parsed.data.tierId,
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization ?? null,
      message: parsed.data.message ?? null,
    });

    return successResponse(application, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromApplicationError(error, "Create membership application"));
  }
}
