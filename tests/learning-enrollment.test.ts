/**
 * UI-35 — Learning enrollment & progress (TDD red phase).
 *
 * Service-level tests against the real Postgres database (the ring-1
 * pattern: the service functions take the caller's userId, which the route
 * layer binds to the session user — no admin API is involved).
 *
 * Documented policies under test:
 *  - Double enrollment is IDEMPOTENT: enrolling in a course you already
 *    have an active (enrolled/completed) enrollment for returns the
 *    existing row; a second row is never created.
 *  - Unenrolling cancels the enrollment (status "canceled"); the row
 *    survives as an honest record, disappears from my-courses, canceling
 *    again is a 404, and re-enrolling reactivates the same row with
 *    progress reset to 0 (a fresh start).
 *  - Progress is a real 0–100 column that defaults to 0; reaching 100
 *    marks the enrollment completed with a completedAt timestamp, and
 *    dropping below 100 reverts it to enrolled.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { course, courseEnrollment, user } from "@/db/schema";
import {
  LearningServiceError,
  cancelEnrollment,
  createCourse,
  enrollInCourse,
  getEnrollment,
  listEnrolledCourses,
  updateEnrollmentProgress,
  type CreateCourseInput,
} from "@/lib/services/learning";
import { signUpWithRole } from "./learning-api/helpers";

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

function courseFixture(suffix: string, withCurriculum: boolean): CreateCourseInput {
  return {
    title: `ui35-${suffix}-${RUN_ID}`,
    description: `Course created by the UI-35 enrollment suite (${suffix}).`,
    category: `UI35 ${RUN_ID}`,
    level: "Beginner",
    ...(withCurriculum
      ? {
          modules: [
            {
              title: `UI35 Module ${RUN_ID}`,
              lessons: [
                { title: "Orientation", duration: "10m", type: "video" },
                { title: "Reading the syllabus", duration: "15m", type: "article" },
              ],
            },
          ],
        }
      : {}),
  };
}

/** Resolves when `fn` throws a LearningServiceError with the given HTTP status. */
async function expectProblem(fn: () => Promise<unknown>, status: number): Promise<void> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(LearningServiceError);
    expect((error as LearningServiceError).problemDetails.status).toBe(status);
    return;
  }
  throw new Error(`expected a ${status} problem but the call succeeded`);
}

async function enrollmentCount(userId: string, courseId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(courseEnrollment)
    .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)));
  return value;
}

let memberA: { userId: string; email: string };
let memberB: { userId: string; email: string };
let curriculumCourseId: string;
let emptyCourseId: string;

beforeAll(async () => {
  memberA = await signUpWithRole(`ui35-a-${RUN_ID}`, null);
  memberB = await signUpWithRole(`ui35-b-${RUN_ID}`, null);
  const withCurriculum = await createCourse(courseFixture("curriculum", true), memberA.email);
  const empty = await createCourse(courseFixture("empty", false), memberB.email);
  curriculumCourseId = withCurriculum.id;
  emptyCourseId = empty.id;
});

afterAll(async () => {
  // Enrollments first (their course FK would cascade anyway), then courses,
  // then users. Guards keep cleanup alive even if beforeAll failed early.
  if (curriculumCourseId && emptyCourseId) {
    await db
      .delete(courseEnrollment)
      .where(inArray(courseEnrollment.courseId, [curriculumCourseId, emptyCourseId]));
    await db.delete(course).where(inArray(course.id, [curriculumCourseId, emptyCourseId]));
  }
  if (memberA?.userId && memberB?.userId) {
    await db.delete(user).where(inArray(user.id, [memberA.userId, memberB.userId]));
  }
});

describe("UI-35 learning enrollment (service level)", () => {
  test("enrolling creates a real row with progress defaulted to 0", async () => {
    const enrollment = await enrollInCourse(memberA.userId, curriculumCourseId);

    expect(enrollment.courseId).toBe(curriculumCourseId);
    expect(enrollment.status).toBe("enrolled");
    expect(enrollment.progress).toBe(0);
    expect(typeof enrollment.enrolledAt).toBe("string");
    expect(enrollment.completedAt).toBeNull();

    // Real round-trip: the row exists in Postgres with the same values.
    const rows = await db
      .select()
      .from(courseEnrollment)
      .where(
        and(
          eq(courseEnrollment.userId, memberA.userId),
          eq(courseEnrollment.courseId, curriculumCourseId),
        ),
      );
    expect(rows).toHaveLength(1);
    expect(rows[0].progress).toBe(0);
    expect(rows[0].status).toBe("ENROLLED");
  });

  test("double enrollment is idempotent — same enrollment, single row", async () => {
    const first = await enrollInCourse(memberA.userId, curriculumCourseId);
    const second = await enrollInCourse(memberA.userId, curriculumCourseId);

    expect(second.id).toBe(first.id);
    expect(second.status).toBe(first.status);
    expect(second.progress).toBe(first.progress);
    expect(await enrollmentCount(memberA.userId, curriculumCourseId)).toBe(1);
  });

  test("my-courses lists only the caller's own enrollments, with real curriculum", async () => {
    await enrollInCourse(memberB.userId, emptyCourseId);

    const ownA = await listEnrolledCourses(memberA.userId);
    const ownB = await listEnrolledCourses(memberB.userId);

    expect(ownA.map((entry) => entry.course.id)).toEqual([curriculumCourseId]);
    expect(ownB.map((entry) => entry.course.id)).toEqual([emptyCourseId]);

    // The joined course DTO carries the real curriculum from metadata.ui.
    expect(ownA[0].course.modules).toHaveLength(1);
    expect(ownA[0].course.modules?.[0].lessons).toHaveLength(2);
    // Progress on the enrollment row is honest (never invented).
    expect(ownA[0].enrollment.progress).toBe(0);
    // Neither member sees the other's enrollment.
    expect(ownA.some((entry) => entry.enrollment.courseId === emptyCourseId)).toBe(false);
    expect(ownB.some((entry) => entry.enrollment.courseId === curriculumCourseId)).toBe(false);
  });

  test("progress updates persist honestly and 100 completes the enrollment", async () => {
    const at40 = await updateEnrollmentProgress(memberA.userId, curriculumCourseId, 40);
    expect(at40.progress).toBe(40);
    expect(at40.status).toBe("enrolled");
    expect(at40.completedAt).toBeNull();

    const done = await updateEnrollmentProgress(memberA.userId, curriculumCourseId, 100);
    expect(done.progress).toBe(100);
    expect(done.status).toBe("completed");
    expect(done.completedAt).not.toBeNull();

    const [row] = await db
      .select()
      .from(courseEnrollment)
      .where(
        and(
          eq(courseEnrollment.userId, memberA.userId),
          eq(courseEnrollment.courseId, curriculumCourseId),
        ),
      );
    expect(row.progress).toBe(100);
    expect(row.status).toBe("COMPLETED");
    expect(row.completedAt).toBeInstanceOf(Date);

    // Dropping below 100 reverts to enrolled and clears completedAt.
    const dropped = await updateEnrollmentProgress(memberA.userId, curriculumCourseId, 60);
    expect(dropped.progress).toBe(60);
    expect(dropped.status).toBe("enrolled");
    expect(dropped.completedAt).toBeNull();
  });

  test("progress is validated to the honest 0–100 integer range", async () => {
    for (const bad of [-1, 101, 55.5]) {
      await expectProblem(
        () => updateEnrollmentProgress(memberA.userId, curriculumCourseId, bad),
        422,
      );
    }
  });

  test("unenroll cancels the enrollment; canceling twice is a 404", async () => {
    const canceled = await cancelEnrollment(memberB.userId, emptyCourseId);
    expect(canceled.status).toBe("canceled");

    // Canceled enrollments disappear from my-courses (honest state)…
    expect(await listEnrolledCourses(memberB.userId)).toEqual([]);
    // …but the row survives with its canceled status — nothing is fabricated.
    const stored = await getEnrollment(memberB.userId, emptyCourseId);
    expect(stored?.status).toBe("canceled");

    await expectProblem(() => cancelEnrollment(memberB.userId, emptyCourseId), 404);
  });

  test("re-enrolling after cancel reactivates the same row with progress reset", async () => {
    const canceledRow = await getEnrollment(memberB.userId, emptyCourseId);
    expect(canceledRow?.status).toBe("canceled");

    const revived = await enrollInCourse(memberB.userId, emptyCourseId);
    expect(revived.id).toBe(canceledRow!.id); // same row, reactivated
    expect(revived.status).toBe("enrolled");
    expect(revived.progress).toBe(0); // documented fresh-start policy
    expect(revived.completedAt).toBeNull();
    expect(await enrollmentCount(memberB.userId, emptyCourseId)).toBe(1);
  });

  test("enrolling in an unknown course is a 404", async () => {
    await expectProblem(() => enrollInCourse(memberA.userId, MISSING_ID), 404);
  });

  test("updating progress without an enrollment is a 404", async () => {
    await expectProblem(() => updateEnrollmentProgress(memberA.userId, emptyCourseId, 10), 404);
  });
});
