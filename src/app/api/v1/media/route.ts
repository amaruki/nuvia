import { NextRequest } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import {
  MediaUploadError,
  listUploadsPaged,
  saveUpload,
  type MediaUploadRecord,
} from "@/lib/services/media-upload.service";

/** Query contract for GET /api/v1/media — mirrors contentListQuerySchema. */
const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

/**
 * GET /api/v1/media — List uploaded media (manifest-backed), server-paginated
 * POST /api/v1/media — Upload media files (multipart/form-data, field "file")
 * Requires: content:read / content:create
 *
 * Media assets have no dedicated permission module yet, so uploads are
 * governed by the content permissions (media exists to serve content).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const params = request.nextUrl.searchParams;
    const parsed = mediaListQuerySchema.safeParse({
      page: params.get("page") ?? undefined,
      limit: params.get("limit") ?? undefined,
      search: params.get("search") ?? undefined,
    });
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await listUploadsPaged(parsed.data);
    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    logger.error("Media list error", error);
    return problemResponse(
      problem("internal-error", 500, "Internal server error", "An unexpected error occurred"),
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("content:create");
    if (!auth.success) return problemResponse(auth.error!);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return problemResponse(
        problem(
          "invalid-request-format",
          400,
          "Invalid request format",
          "Request body must be multipart/form-data",
        ),
      );
    }

    const files = formData.getAll("file").filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) {
      return problemResponse(
        problem(
          "invalid-request-format",
          400,
          "Invalid request format",
          'Provide at least one file in a "file" form field',
        ),
      );
    }

    const saved: MediaUploadRecord[] = [];
    for (const file of files) {
      saved.push(await saveUpload(file, auth.user!.id));
    }
    return successResponse(saved);
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return problemResponse(problem(error.slug, error.status, error.title, error.message));
    }
    logger.error("Media upload error", error);
    return problemResponse(
      problem("internal-error", 500, "Internal server error", "An unexpected error occurred"),
    );
  }
}
