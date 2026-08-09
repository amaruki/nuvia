/**
 * Enrollment reads (backlog UI-35). Ring-1: every function takes the
 * caller's userId — route handlers bind it to the session user, so a
 * member only ever sees their own enrollments.
 */

import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { course, courseEnrollment } from "@/db/schema/learning";
import type { EnrolledCourse, Enrollment } from "@/types/learning.types";
import { toUiEnrolledCourse, toUiEnrollment } from "./enrollment-mappers";

/** The caller's own enrollment row for a course, in any status. */
export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const rows = await db
    .select()
    .from(courseEnrollment)
    .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
    .limit(1);
  return rows.length > 0 ? toUiEnrollment(rows[0]) : null;
}

/**
 * The caller's my-courses list: active (enrolled/completed) enrollments
 * joined with their course. Canceled enrollments stay in the database as
 * honest history but are not listed.
 */
export async function listEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
  const rows = await db
    .select({ enrollment: courseEnrollment, course })
    .from(courseEnrollment)
    .innerJoin(course, eq(courseEnrollment.courseId, course.id))
    .where(and(eq(courseEnrollment.userId, userId), ne(courseEnrollment.status, "CANCELED")))
    .orderBy(desc(courseEnrollment.enrolledAt));

  return rows.map((row) => toUiEnrolledCourse(row.enrollment, row.course));
}
