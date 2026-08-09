import { certificate, course, courseEnrollment } from "@/db/schema/learning";
import type { CertificateStatus, CourseLevel, EnrollmentStatus } from "@/types/learning.types";

// ---------------------------------------------------------------------------
// Level/status mapping (DB enums are SCREAMING_SNAKE, UI is title/lowercase)
// ---------------------------------------------------------------------------

export type DbCourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type DbCertificateStatus = "ACTIVE" | "REVOKED";
export type DbEnrollmentStatus = "ENROLLED" | "COMPLETED" | "CANCELED";

export const UI_TO_DB_LEVEL: Record<CourseLevel, DbCourseLevel> = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
};

export const DB_TO_UI_LEVEL: Record<DbCourseLevel, CourseLevel> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const UI_TO_DB_CERT_STATUS: Record<CertificateStatus, DbCertificateStatus> = {
  active: "ACTIVE",
  revoked: "REVOKED",
};

export const DB_TO_UI_CERT_STATUS: Record<DbCertificateStatus, CertificateStatus> = {
  ACTIVE: "active",
  REVOKED: "revoked",
};

export const UI_TO_DB_ENROLLMENT_STATUS: Record<EnrollmentStatus, DbEnrollmentStatus> = {
  enrolled: "ENROLLED",
  completed: "COMPLETED",
  canceled: "CANCELED",
};

export const DB_TO_UI_ENROLLMENT_STATUS: Record<DbEnrollmentStatus, EnrollmentStatus> = {
  ENROLLED: "enrolled",
  COMPLETED: "completed",
  CANCELED: "canceled",
};

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type CourseRow = typeof course.$inferSelect;
export type CertificateRow = typeof certificate.$inferSelect;
export type CourseEnrollmentRow = typeof courseEnrollment.$inferSelect;

/** Gradient used when a course was created without an explicit color. */
export const DEFAULT_COURSE_COLOR = "from-blue-500 to-indigo-600";
