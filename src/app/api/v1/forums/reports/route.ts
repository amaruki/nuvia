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
 * GET /api/v1/forums/reports - List content reports (filter: status; page/limit)
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
    const rawPage = Number.parseInt(searchParams.get("page") ?? "", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    const result = await listReports(status, { page, limit });
    return NextResponse.json(
      successResponse(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }),
    );
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
