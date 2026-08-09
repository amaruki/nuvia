/**
 * /api/v1/learning/enrollments — the authenticated user's own enrollments
 * (backlog UI-35, ring-1). Any signed-in account role may manage their own
 * enrollments; the service layer filters by the session user's id.
 *
 * GET  — my-courses list: active enrollments joined with their course.
 * POST — enroll. IDEMPOTENT (documented policy, see enrollment-mutations):
 *        an active enrollment is returned unchanged, a canceled one is
 *        reactivated as a fresh start.
 */

import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createEnrollmentSchema,
  enrollInCourse,
  listEnrolledCourses,
} from "@/lib/services/learning";
import { handleLearningRoute } from "../_lib";

export async function GET(request: NextRequest) {
  return handleLearningRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const enrollments = await listEnrolledCourses(auth.user!.id);
    return successResponse(enrollments);
  }, "GET /api/v1/learning/enrollments");
}

export async function POST(request: NextRequest) {
  return handleLearningRoute(async () => {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const json = await request.json();
    const parsed = createEnrollmentSchema.safeParse(json);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const enrollment = await enrollInCourse(auth.user!.id, parsed.data.courseId);
    return successResponse(enrollment, undefined, { status: 201 });
  }, "POST /api/v1/learning/enrollments");
}
