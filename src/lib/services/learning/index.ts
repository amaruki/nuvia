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
 * denormalize course name/instructor/image at issue time; progress is a
 * neutral 0 until enrollment tracking exists (see schema header).
 */

export { LearningServiceError } from "./errors";
export {
  createCourseSchema,
  issueCertificateSchema,
  updateCertificateSchema,
  updateCourseSchema,
} from "./schemas";
export type {
  CreateCourseInput,
  IssueCertificateInput,
  UpdateCertificateInput,
  UpdateCourseInput,
} from "./schemas";
export { computeDuration } from "./helpers";
export { getCourse, listCourses } from "./course-queries";
export { createCourse, deleteCourse, updateCourse } from "./course-mutations";
export { getCertificate, listCertificates } from "./certificate-queries";
export { issueCertificate, updateCertificate } from "./certificate-mutations";
export type { CertificateListFilters, CourseListFilters, Paginated } from "./query-helpers";
