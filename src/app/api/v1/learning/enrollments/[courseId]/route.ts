/**
 * /api/v1/learning/enrollments/[courseId] — the authenticated user's own
 * enrollment in one course (backlog UI-35, ring-1).
 *
 * PATCH  { progress: 0–100 } — honest progress update; 100 completes the
 *                               enrollment, dropping below reverts it.
 * DELETE                     — unenroll: cancels the enrollment row (the
 *                               row survives as honest history).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  cancelEnrollment,
  updateEnrollmentProgress,
  updateEnrollmentProgressSchema,
} from "@/lib/services/learning";
import { handleLearningRoute } from "../../_lib";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  return handleLearningRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { courseId } = await params;
    const json = await request.json();
    const parsed = updateEnrollmentProgressSchema.safeParse(json);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const enrollment = await updateEnrollmentProgress(
      auth.user!.id,
      courseId,
      parsed.data.progress,
    );
    return successResponse(enrollment);
  }, "PATCH /api/v1/learning/enrollments/[courseId]");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  return handleLearningRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { courseId } = await params;
    await cancelEnrollment(auth.user!.id, courseId);
    return new NextResponse(null, { status: 204 });
  }, "DELETE /api/v1/learning/enrollments/[courseId]");
}
