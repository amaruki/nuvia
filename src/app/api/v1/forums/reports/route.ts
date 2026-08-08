import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createReport,
  createReportSchema,
  forumProblemFromError,
  listReports,
} from "@/lib/services/forum";

/**
 * GET /api/v1/forums/reports - List content reports (filter: status)
 * Requires: forum:moderate permission
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("forum:moderate");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const reports = await listReports(status);
    return NextResponse.json(successResponse(reports));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * POST /api/v1/forums/reports - File a report against a post or comment
 * Requires: forum:create permission
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("forum:create");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const body = await request.json().catch(() => null);
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const report = await createReport(parsed.data, auth.user!);
    return NextResponse.json(successResponse(report), { status: 201 });
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
