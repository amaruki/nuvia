import { certificate, course } from "@/db/schema/learning";
import type { CertificateStatus, CourseLevel } from "@/types/learning.types";

// ---------------------------------------------------------------------------
// Level/status mapping (DB enums are SCREAMING_SNAKE, UI is title/lowercase)
// ---------------------------------------------------------------------------

export type DbCourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type DbCertificateStatus = "ACTIVE" | "REVOKED";

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

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type CourseRow = typeof course.$inferSelect;
export type CertificateRow = typeof certificate.$inferSelect;

/** Gradient used when a course was created without an explicit color. */
export const DEFAULT_COURSE_COLOR = "from-blue-500 to-indigo-600";
