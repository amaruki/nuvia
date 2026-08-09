/**
 * Row → DTO mapping for course enrollments (backlog UI-35). Wire shapes
 * follow src/types/learning.types.ts: lowercase status, ISO date strings.
 */

import type { EnrolledCourse, Enrollment } from "@/types/learning.types";
import { toUiCourse } from "./mappers";
import { DB_TO_UI_ENROLLMENT_STATUS, type CourseEnrollmentRow, type CourseRow } from "./types";

export function toUiEnrollment(row: CourseEnrollmentRow): Enrollment {
  return {
    id: row.id,
    courseId: row.courseId,
    status: DB_TO_UI_ENROLLMENT_STATUS[row.status],
    progress: row.progress,
    enrolledAt: row.enrolledAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

export function toUiEnrolledCourse(
  enrollmentRow: CourseEnrollmentRow,
  courseRow: CourseRow,
): EnrolledCourse {
  return {
    enrollment: toUiEnrollment(enrollmentRow),
    course: toUiCourse(courseRow),
  };
}
