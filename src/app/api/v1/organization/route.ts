import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { organizationUpdateSchema } from "@/lib/validation/organization.validation";
import { getOrganization, updateOrganization } from "@/lib/services/organization.service";

// Per-request by design (session-scoped singleton reads/writes) — and
// without this Next.js collects the handler-less route statically at
// build time.
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organization - Get the organization singleton
 * Requires: organization:read permission
 */
export async function GET() {
  try {
    const auth = await requirePermission("organization:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const organizationRow = await getOrganization();
    return successResponse(organizationRow);
  } catch (error) {
    logger.error("Get organization error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while reading the organization"),
    );
  }
}

/**
 * PATCH /api/v1/organization - Update the organization singleton
 * Requires: organization:update permission
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission("organization:update");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = organizationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const organizationRow = await updateOrganization(parsed.data, auth.user!.id);
    return successResponse(organizationRow);
  } catch (error) {
    logger.error("Update organization error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while updating the organization"),
    );
  }
}
