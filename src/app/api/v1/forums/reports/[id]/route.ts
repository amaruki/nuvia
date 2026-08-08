import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { forumProblemFromError, resolveReport, resolveReportSchema } from "@/lib/services/forum";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/v1/forums/reports/:id - Resolve or dismiss a report
 * Body: { action: "RESOLVED" | "DISMISSED", deleteContent?: boolean }
 * Requires: forum:moderate permission
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:moderate");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = resolveReportSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const report = await resolveReport(id, parsed.data, auth.user!);
    return NextResponse.json(successResponse(report));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
