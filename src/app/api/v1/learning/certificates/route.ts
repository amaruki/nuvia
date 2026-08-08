/**
 * GET  /api/v1/learning/certificates — list certificates (filterable, searchable, paginated)
 * POST /api/v1/learning/certificates — issue a certificate
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  issueCertificate,
  issueCertificateSchema,
  listCertificates,
} from "@/lib/services/learning.service";
import { handleLearningRoute, parsePagination } from "../_lib";

export async function GET(request: NextRequest) {
  return handleLearningRoute(async () => {
    const auth = await requirePermission("learning:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = parsePagination(searchParams);

    const result = await listCertificates({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      courseId: searchParams.get("courseId") ?? undefined,
      page,
      limit,
    });

    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/learning/certificates");
}

export async function POST(request: NextRequest) {
  return handleLearningRoute(async () => {
    const auth = await requirePermission("learning:create", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem("validation-error", 422, "Validation failed", "Request body must be valid JSON"),
      );
    }

    const parsed = issueCertificateSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const issued = await issueCertificate(parsed.data, auth.user!.email);
    return successResponse(issued, undefined, { status: 201 });
  }, "POST /api/v1/learning/certificates");
}
