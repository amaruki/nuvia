/**
 * GET    /api/v1/chapters/[id] — fetch one chapter
 * PATCH  /api/v1/chapters/[id] — update a chapter
 * DELETE /api/v1/chapters/[id] — delete a chapter (members cascade)
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import {
  deleteChapter,
  getChapter,
  updateChapter,
  updateChapterSchema,
} from "@/lib/services/chapter.service";
import { handleChapterRoute } from "../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleChapterRoute(async () => {
    const auth = await requirePermission("chapters:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const found = await getChapter(id);
    if (!found) {
      return problemResponse(problems.notFound("Chapter not found"));
    }
    return successResponse(found);
  }, "GET /api/v1/chapters/[id]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleChapterRoute(async () => {
    const auth = await requirePermission("chapters:update", request.headers);
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

    const parsed = updateChapterSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const updated = await updateChapter(id, parsed.data, auth.user!.email);
    return successResponse(updated);
  }, "PATCH /api/v1/chapters/[id]");
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return handleChapterRoute(async () => {
    const auth = await requirePermission("chapters:delete", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const deleted = await deleteChapter(id);
    if (!deleted) {
      return problemResponse(problems.notFound("Chapter not found"));
    }
    return successResponse({ id, deleted: true });
  }, "DELETE /api/v1/chapters/[id]");
}
