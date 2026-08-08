/**
 * Job board — shared DTOs, enums, status-transition rules and display helpers.
 *
 * This module is client-safe (no server imports): the dashboard pages and the
 * public job pages both consume these types straight from the API payloads.
 */

export const JOB_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "CLOSED",
  "FILLED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
  "TEMPORARY",
  "VOLUNTEER",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EXPERIENCE_LEVELS = [
  "ENTRY_LEVEL",
  "JUNIOR",
  "MID_LEVEL",
  "SENIOR",
  "LEAD",
  "EXECUTIVE",
  "NOT_SPECIFIED",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const APPLICATION_STATUSES = [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "INTERVIEWING",
  "OFFERED",
  "HIRED",
  "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Allowed application status transitions. Terminal states map to an empty
 * list. The API rejects any transition not listed here with HTTP 409.
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  PENDING: ["REVIEWING", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  REVIEWING: ["SHORTLISTED", "INTERVIEWING", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["INTERVIEWING", "OFFERED", "REJECTED", "WITHDRAWN"],
  INTERVIEWING: ["OFFERED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["HIRED", "REJECTED", "WITHDRAWN"],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** The only status change an applicant may make to their own application. */
export const SELF_SERVICE_TRANSITION: ApplicationStatus = "WITHDRAWN";

// ---------------------------------------------------------------------------
// DTOs (camelCase JSON, as returned by /api/v1/jobs)
// ---------------------------------------------------------------------------

export interface JobPostingDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  categoryId: string;
  categoryName: string;
  typeId: string;
  typeName: string;
  locationId: string;
  locationName: string;
  companyId: string;
  companyName: string;
  companyLogo: string | null;
  status: JobStatus;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  isRemote: boolean;
  isFeatured: boolean;
  applicationDeadline: string | null;
  viewCount: number;
  applicationCount: number;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationDto {
  id: string;
  jobId: string;
  jobTitle: string | null;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumePath: string | null;
  portfolioUrl: string | null;
  salaryExpectation: number | null;
  availability: string | null;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
}

export interface JobBoardMeta {
  categories: Array<{ id: string; name: string; displayName: string; sortOrder: number }>;
  types: Array<{ id: string; name: string; displayName: string }>;
  locations: Array<{ id: string; name: string; displayName: string; remote: boolean }>;
  companies: Array<{ id: string; name: string; displayName: string; logo: string | null }>;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  CLOSED: "Closed",
  FILLED: "Filled",
  CANCELLED: "Cancelled",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  VOLUNTEER: "Volunteer",
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  ENTRY_LEVEL: "Entry level",
  JUNIOR: "Junior",
  MID_LEVEL: "Mid level",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
  NOT_SPECIFIED: "Not specified",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "New",
  REVIEWING: "Screening",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  INTERVIEWING: "Interview",
  OFFERED: "Offer",
  HIRED: "Hired",
  WITHDRAWN: "Withdrawn",
};

export function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  currency: string,
): string {
  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  if (salaryMin === null && salaryMax === null) return "Salary undisclosed";
  if (salaryMin !== null && salaryMax !== null) return `${fmt(salaryMin)} – ${fmt(salaryMax)}`;
  return fmt(salaryMin ?? salaryMax!);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
