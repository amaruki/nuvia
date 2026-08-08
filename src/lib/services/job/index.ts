/**
 * Job board service — the single DB access layer for postings, applications
 * and the reference tables (categories, types, locations, companies).
 *
 * Consumed by the /api/v1/jobs route handlers and by the public (public)/jobs
 * server components. Throws {@link JobServiceError} carrying an RFC 9457
 * ProblemDetails payload; callers map it through `problemResponse`.
 */

export { JobServiceError } from "./errors";
export { getJobPosting, listJobPostings } from "./posting-queries";
export { createJobPosting, deleteJobPosting, updateJobPosting } from "./posting-mutations";
export { getJobBoardMeta } from "./board-meta";
export {
  getJobApplication,
  listApplicationsForUser,
  listJobApplications,
} from "./application-queries";
export { createApplication, updateApplicationStatus } from "./application-mutations";
export {
  getPublicJobPosting,
  getPublicJobPostingBySlug,
  listPublicJobPostings,
} from "./public-board";
export type { Paginated, PostingListFilters } from "./query-helpers";
export type { PublicJobFilters } from "./public-board";
