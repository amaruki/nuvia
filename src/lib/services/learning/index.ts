/**
 * Learning & Development service — course and certificate CRUD over the
 * real `courses` / `certificates` tables (backlog D3).
 *
 * House error style mirrors chapter/errors.ts: a ServiceError carrying an
 * RFC 9457 ProblemDetails, PG 23505 mapped to a 409 conflict, zod schemas
 * for create/update, and `{ items, page, limit, total, totalPages }` lists.
 *
 * Courses store instructor fields as flat columns and the UI-only documents
 * (color, features, curriculum modules, reviews) under `metadata.ui` — the
 * same technique content uses for its metadata blob. Certificates
 * denormalize course name/instructor/image at issue time. Enrollments
 * (backlog UI-35) track per-member status and honest 0–100 progress in the
 * `course_enrollments` table; the catalog course DTO keeps a neutral
 * progress of 0 (see schema header).
 */

export { LearningServiceError } from "./errors";
export {
  createCourseSchema,
  issueCertificateSchema,
  updateCertificateSchema,
  updateCourseSchema,
  createEnrollmentSchema,
  updateEnrollmentProgressSchema,
} from "./schemas";
export type {
  CreateCourseInput,
  IssueCertificateInput,
  UpdateCertificateInput,
  UpdateCourseInput,
  CreateEnrollmentInput,
  UpdateEnrollmentProgressInput,
} from "./schemas";
export { computeDuration } from "./helpers";
export { assertCourseExists, getCourse, listCourses } from "./course-queries";
export { createCourse, deleteCourse, updateCourse } from "./course-mutations";
export { getCertificate, listCertificates } from "./certificate-queries";
export { issueCertificate, updateCertificate } from "./certificate-mutations";
export { getEnrollment, listEnrolledCourses } from "./enrollment-queries";
export { cancelEnrollment, enrollInCourse, updateEnrollmentProgress } from "./enrollment-mutations";
export { toUiEnrolledCourse, toUiEnrollment } from "./enrollment-mappers";
export type { CertificateListFilters, CourseListFilters, Paginated } from "./query-helpers";
