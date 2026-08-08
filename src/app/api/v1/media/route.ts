import { NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import { problem, problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import {
  MediaUploadError,
  listUploads,
  saveUpload,
  type MediaUploadRecord,
} from "@/lib/services/media-upload.service";

/**
 * GET /api/v1/media — List uploaded media (manifest-backed)
 * POST /api/v1/media — Upload media files (multipart/form-data, field "file")
 * Requires: content:read / content:create
 *
 * Media assets have no dedicated permission module yet, so uploads are
 * governed by the content permissions (media exists to serve content).
 */
export async function GET() {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const records = await listUploads();
    return successResponse(records);
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
