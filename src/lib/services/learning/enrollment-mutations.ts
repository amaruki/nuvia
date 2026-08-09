/**
 * Enrollment writes (backlog UI-35). Ring-1: every function takes the
 * caller's userId — route handlers bind it to the session user.
 *
 * Documented double-enrollment policy: IDEMPOTENT.
 *  - Enrolling with an active (enrolled/completed) enrollment returns the
 *    existing row unchanged — never a second row, never a 409.
 *  - Enrolling with a canceled enrollment reactivates the same row as a
 *    fresh start: status enrolled, progress reset to 0, completedAt null.
 *  - Unenrolling cancels (it does not delete) the row, so history stays
 *    honest; canceling an inactive enrollment is a 404.
 */

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { courseEnrollment } from "@/db/schema/learning";
import { problems, validationProblem } from "@/lib/http";
import type { Enrollment } from "@/types/learning.types";
import { assertCourseExists } from "./course-queries";
import { toUiEnrollment } from "./enrollment-mappers";
import { LearningServiceError, pgErrorCode, UNIQUE_VIOLATION } from "./errors";
import { updateEnrollmentProgressSchema } from "./schemas";
import type { CourseEnrollmentRow } from "./types";

async function fetchEnrollmentRow(
  userId: string,
  courseId: string,
): Promise<CourseEnrollmentRow | null> {
  const rows = await db
    .select()
    .from(courseEnrollment)
    .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
  await assertCourseExists(courseId);

  const existing = await fetchEnrollmentRow(userId, courseId);
  if (existing) {
    if (existing.status !== "CANCELED") {
      // Idempotent double-enroll: return the active enrollment unchanged.
      return toUiEnrollment(existing);
    }
    // Reactivate the canceled row as a fresh start (progress reset).
    const [revived] = await db
      .update(courseEnrollment)
      .set({
        status: "ENROLLED",
        progress: 0,
        enrolledAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(courseEnrollment.id, existing.id))
      .returning();
    return toUiEnrollment(revived);
  }

  try {
    // status ENROLLED and progress 0 come from the table defaults.
    const [row] = await db.insert(courseEnrollment).values({ userId, courseId }).returning();
    return toUiEnrollment(row);
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      // Concurrent double-enroll race — honor the idempotent policy.
      const raced = await fetchEnrollmentRow(userId, courseId);
      if (raced) return toUiEnrollment(raced);
    }
    throw new LearningServiceError(problems.internalError("Could not create the enrollment"));
  }
}

/**
 * Unenroll: cancel the caller's active enrollment. The row survives with
 * status CANCELED (honest history); canceling twice is a 404.
 */
export async function cancelEnrollment(userId: string, courseId: string): Promise<Enrollment> {
  const [row] = await db
    .update(courseEnrollment)
    .set({ status: "CANCELED", completedAt: null })
    .where(
      and(
        eq(courseEnrollment.userId, userId),
        eq(courseEnrollment.courseId, courseId),
        inArray(courseEnrollment.status, ["ENROLLED", "COMPLETED"]),
      ),
    )
    .returning();

  if (!row) {
    throw new LearningServiceError(problems.notFound("Enrollment not found"));
  }
  return toUiEnrollment(row);
}

/**
 * Persist an honest progress value (0–100) on the caller's active
 * enrollment. Reaching 100 completes the enrollment (completedAt set);
 * dropping below 100 reverts it to enrolled. Progress on a canceled
 * enrollment cannot change — the enrollment must be reactivated first.
 */
export async function updateEnrollmentProgress(
  userId: string,
  courseId: string,
  progress: number,
): Promise<Enrollment> {
  const parsed = updateEnrollmentProgressSchema.safeParse({ progress });
  if (!parsed.success) {
    throw new LearningServiceError(validationProblem(parsed.error));
  }

  const existing = await fetchEnrollmentRow(userId, courseId);
  if (!existing || existing.status === "CANCELED") {
    throw new LearningServiceError(problems.notFound("Enrollment not found"));
  }

  const completed = parsed.data.progress === 100;
  const [row] = await db
    .update(courseEnrollment)
    .set({
      progress: parsed.data.progress,
      status: completed ? "COMPLETED" : "ENROLLED",
      completedAt: completed ? (existing.completedAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(eq(courseEnrollment.id, existing.id))
    .returning();

  return toUiEnrollment(row);
}
