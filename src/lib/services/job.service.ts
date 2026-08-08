/**
 * Job board service — the single DB access layer for postings, applications
 * and the reference tables (categories, types, locations, companies).
 *
 * Consumed by the /api/v1/jobs route handlers and by the public (public)/jobs
 * server components. Throws {@link JobServiceError} carrying an RFC 9457
 * ProblemDetails payload; callers map it through `problemResponse`.
 */

import { and, asc, count, desc, eq, gt, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  company,
  jobApplication,
  jobCategory,
  jobPosting,
  jobType,
  location,
  user,
} from "@/db/schema";
import { problem, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import {
  APPLICATION_STATUS_TRANSITIONS,
  SELF_SERVICE_TRANSITION,
  type JobApplicationDto,
  type JobBoardMeta,
  type JobPostingDto,
} from "@/types/jobs.types";
import type {
  CreateJobApplicationInput,
  CreateJobPostingInput,
  UpdateApplicationStatusInput,
  UpdateJobPostingInput,
} from "./job.schemas";

export class JobServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "JobServiceError";
  }
}

type WhereClause = SQL | undefined;

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

type PostingRow = typeof jobPosting.$inferSelect & {
  categoryName: string;
  typeName: string;
  locationName: string;
  companyName: string;
  companyLogo: string | null;
};

type NestedPostingRow = {
  posting: typeof jobPosting.$inferSelect;
  categoryName: string;
  typeName: string;
  locationName: string;
  companyName: string;
  companyLogo: string | null;
};

/** Drizzle's grouped select nests the posting columns under `posting`. */
function flattenPostingRow(row: NestedPostingRow): PostingRow {
  return {
    ...row.posting,
    categoryName: row.categoryName,
    typeName: row.typeName,
    locationName: row.locationName,
    companyName: row.companyName,
    companyLogo: row.companyLogo,
  };
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toPostingDto(row: PostingRow): JobPostingDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities,
    benefits: row.benefits,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    typeId: row.typeId,
    typeName: row.typeName,
    locationId: row.locationId,
    locationName: row.locationName,
    companyId: row.companyId,
    companyName: row.companyName,
    companyLogo: row.companyLogo,
    status: row.status,
    employmentType: row.employmentType,
    experienceLevel: row.experienceLevel,
    salaryMin: toNumber(row.salaryMin),
    salaryMax: toNumber(row.salaryMax),
    currency: row.currency,
    isRemote: row.isRemote,
    isFeatured: row.isFeatured,
    applicationDeadline: toIso(row.applicationDeadline),
    viewCount: row.viewCount,
    applicationCount: row.applicationCount,
    tags: row.tags ?? [],
    publishedAt: toIso(row.publishedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type ApplicationRow = typeof jobApplication.$inferSelect & {
  jobTitle: string | null;
  applicantName: string;
  applicantEmail: string;
};

function toApplicationDto(row: ApplicationRow): JobApplicationDto {
  return {
    id: row.id,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    userId: row.userId,
    applicantName: row.applicantName,
    applicantEmail: row.applicantEmail,
    status: row.status,
    coverLetter: row.coverLetter,
    resumePath: row.resumePath,
    portfolioUrl: row.portfolioUrl,
    salaryExpectation: toNumber(row.salaryExpectation),
    availability: row.availability,
    notes: row.notes,
    appliedAt: row.appliedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const postingSelect = {
  posting: jobPosting,
  categoryName: jobCategory.displayName,
  typeName: jobType.displayName,
  locationName: location.displayName,
  companyName: company.displayName,
  companyLogo: company.logo,
} as const;

export interface PostingListFilters {
  status?: string;
  search?: string;
  categoryId?: string;
  typeId?: string;
  locationId?: string;
  companyId?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function paginate(page?: number, limit?: number): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function joinedPostingQuery(where: WhereClause) {
  return db
    .select(postingSelect)
    .from(jobPosting)
    .innerJoin(jobCategory, eq(jobPosting.categoryId, jobCategory.id))
    .innerJoin(jobType, eq(jobPosting.typeId, jobType.id))
    .innerJoin(location, eq(jobPosting.locationId, location.id))
    .innerJoin(company, eq(jobPosting.companyId, company.id))
    .$dynamic()
    .where(where);
}

// ---------------------------------------------------------------------------
// Postings
// ---------------------------------------------------------------------------

export async function listJobPostings(
  filters: PostingListFilters = {},
): Promise<Paginated<JobPostingDto>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(jobPosting.status, filters.status as never));
  if (filters.categoryId) conditions.push(eq(jobPosting.categoryId, filters.categoryId));
  if (filters.typeId) conditions.push(eq(jobPosting.typeId, filters.typeId));
  if (filters.locationId) conditions.push(eq(jobPosting.locationId, filters.locationId));
  if (filters.companyId) conditions.push(eq(jobPosting.companyId, filters.companyId));
  if (filters.isFeatured !== undefined)
    conditions.push(eq(jobPosting.isFeatured, filters.isFeatured));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(jobPosting.title, term),
        ilike(company.displayName, term),
        ilike(jobPosting.slug, term),
      )!,
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    joinedPostingQuery(where).orderBy(desc(jobPosting.createdAt)).limit(limit).offset(offset),
    db
      .select({ value: count() })
      .from(jobPosting)
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return {
    items: rows.map((row) => toPostingDto(flattenPostingRow(row))),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getJobPosting(id: string): Promise<JobPostingDto | null> {
  const rows = await joinedPostingQuery(eq(jobPosting.id, id)).limit(1);
  const row = rows[0];
  return row ? toPostingDto(flattenPostingRow(row)) : null;
}

async function assertReferencesExist(input: {
  categoryId?: string;
  typeId?: string;
  locationId?: string;
  companyId?: string;
}): Promise<void> {
  const checks: Array<{ field: string; label: string; found: boolean }> = [];

  if (input.categoryId) {
    const found = await db
      .select({ id: jobCategory.id })
      .from(jobCategory)
      .where(eq(jobCategory.id, input.categoryId))
      .limit(1);
    checks.push({ field: "categoryId", label: "Job category", found: found.length > 0 });
  }
  if (input.typeId) {
    const found = await db
      .select({ id: jobType.id })
      .from(jobType)
      .where(eq(jobType.id, input.typeId))
      .limit(1);
    checks.push({ field: "typeId", label: "Job type", found: found.length > 0 });
  }
  if (input.locationId) {
    const found = await db
      .select({ id: location.id })
      .from(location)
      .where(eq(location.id, input.locationId))
      .limit(1);
    checks.push({ field: "locationId", label: "Location", found: found.length > 0 });
  }
  if (input.companyId) {
    const found = await db
      .select({ id: company.id })
      .from(company)
      .where(eq(company.id, input.companyId))
      .limit(1);
    checks.push({ field: "companyId", label: "Company", found: found.length > 0 });
  }

  const missing = checks.filter((check) => !check.found);
  if (missing.length > 0) {
    throw new JobServiceError(
      problem("validation-error", 422, "Validation failed", "Referenced records do not exist", {
        errors: missing.map((m) => ({ field: m.field, message: `${m.label} does not exist` })),
      }),
    );
  }
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "job"
  );
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 8)}`;
    const existing = await db
      .select({ id: jobPosting.id })
      .from(jobPosting)
      .where(eq(jobPosting.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createJobPosting(
  input: CreateJobPostingInput,
  postedBy: string,
): Promise<JobPostingDto> {
  await assertReferencesExist(input);

  const slug = await generateUniqueSlug(input.title);
  const inserted = await db
    .insert(jobPosting)
    .values({
      title: input.title,
      slug,
      description: input.description,
      requirements: input.requirements,
      responsibilities: input.responsibilities,
      benefits: input.benefits,
      categoryId: input.categoryId,
      typeId: input.typeId,
      locationId: input.locationId,
      companyId: input.companyId,
      postedBy,
      status: input.status,
      employmentType: input.employmentType,
      experienceLevel: input.experienceLevel,
      salaryMin: input.salaryMin !== undefined ? String(input.salaryMin) : null,
      salaryMax: input.salaryMax !== undefined ? String(input.salaryMax) : null,
      currency: input.currency,
      isRemote: input.isRemote,
      isFeatured: input.isFeatured,
      applicationDeadline: input.applicationDeadline ?? null,
      tags: input.tags,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    })
    .returning();

  const dto = await getJobPosting(inserted[0]!.id);
  if (!dto) {
    throw new JobServiceError(
      problem("not-found", 404, "Not found", "Job posting disappeared after insert"),
    );
  }
  return dto;
}

export async function updateJobPosting(
  id: string,
  input: UpdateJobPostingInput,
): Promise<JobPostingDto> {
  const existing = await db.select().from(jobPosting).where(eq(jobPosting.id, id)).limit(1);
  const current = existing[0];
  if (!current)
    throw new JobServiceError(problem("not-found", 404, "Not found", "Job posting not found"));

  await assertReferencesExist(input);

  const values: Partial<typeof jobPosting.$inferInsert> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.description !== undefined) values.description = input.description;
  if (input.requirements !== undefined) values.requirements = input.requirements;
  if (input.responsibilities !== undefined) values.responsibilities = input.responsibilities;
  if (input.benefits !== undefined) values.benefits = input.benefits;
  if (input.categoryId !== undefined) values.categoryId = input.categoryId;
  if (input.typeId !== undefined) values.typeId = input.typeId;
  if (input.locationId !== undefined) values.locationId = input.locationId;
  if (input.companyId !== undefined) values.companyId = input.companyId;
  if (input.employmentType !== undefined) values.employmentType = input.employmentType;
  if (input.experienceLevel !== undefined) values.experienceLevel = input.experienceLevel;
  if (input.salaryMin !== undefined) values.salaryMin = String(input.salaryMin);
  if (input.salaryMax !== undefined) values.salaryMax = String(input.salaryMax);
  if (input.currency !== undefined) values.currency = input.currency;
  if (input.isRemote !== undefined) values.isRemote = input.isRemote;
  if (input.isFeatured !== undefined) values.isFeatured = input.isFeatured;
  if (input.applicationDeadline !== undefined)
    values.applicationDeadline = input.applicationDeadline;
  if (input.tags !== undefined) values.tags = input.tags;
  if (input.status !== undefined) {
    values.status = input.status;
    if (input.status === "PUBLISHED" && !current.publishedAt) {
      values.publishedAt = new Date();
    }
  }

  if (Object.keys(values).length > 0) {
    await db.update(jobPosting).set(values).where(eq(jobPosting.id, id));
  }

  const dto = await getJobPosting(id);
  if (!dto) {
    throw new JobServiceError(
      problem("not-found", 404, "Not found", "Job posting disappeared after update"),
    );
  }
  return dto;
}

export async function deleteJobPosting(id: string): Promise<boolean> {
  const existing = await db
    .select({ id: jobPosting.id })
    .from(jobPosting)
    .where(eq(jobPosting.id, id))
    .limit(1);
  if (existing.length === 0) return false;

  await db.transaction(async (tx) => {
    await tx.delete(jobApplication).where(eq(jobApplication.jobId, id));
    await tx.delete(jobPosting).where(eq(jobPosting.id, id));
  });
  return true;
}

// ---------------------------------------------------------------------------
// Board metadata (reference tables)
// ---------------------------------------------------------------------------

export async function getJobBoardMeta(): Promise<JobBoardMeta> {
  const [categories, types, locations, companies] = await Promise.all([
    db
      .select({
        id: jobCategory.id,
        name: jobCategory.name,
        displayName: jobCategory.displayName,
        sortOrder: jobCategory.sortOrder,
      })
      .from(jobCategory)
      .where(eq(jobCategory.isActive, true))
      .orderBy(asc(jobCategory.sortOrder), asc(jobCategory.name)),
    db
      .select({ id: jobType.id, name: jobType.name, displayName: jobType.displayName })
      .from(jobType)
      .where(eq(jobType.isActive, true))
      .orderBy(asc(jobType.displayName)),
    db
      .select({
        id: location.id,
        name: location.name,
        displayName: location.displayName,
        remote: location.remote,
      })
      .from(location)
      .where(eq(location.isActive, true))
      .orderBy(asc(location.sortOrder), asc(location.name)),
    db
      .select({
        id: company.id,
        name: company.name,
        displayName: company.displayName,
        logo: company.logo,
      })
      .from(company)
      .where(eq(company.isActive, true))
      .orderBy(asc(company.displayName)),
  ]);

  return { categories, types, locations, companies };
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

function joinedApplicationQuery(where: WhereClause) {
  return db
    .select({
      application: jobApplication,
      jobTitle: jobPosting.title,
      applicantName: user.name,
      applicantEmail: user.email,
    })
    .from(jobApplication)
    .innerJoin(jobPosting, eq(jobApplication.jobId, jobPosting.id))
    .innerJoin(user, eq(jobApplication.userId, user.id))
    .$dynamic()
    .where(where);
}

function flattenApplicationRow(row: {
  application: typeof jobApplication.$inferSelect;
  jobTitle: string | null;
  applicantName: string | null;
  applicantEmail: string | null;
}): ApplicationRow {
  return {
    ...row.application,
    jobTitle: row.jobTitle,
    applicantName: row.applicantName ?? "Unknown applicant",
    applicantEmail: row.applicantEmail ?? "",
  };
}

export async function listJobApplications(
  filters: {
    jobId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<Paginated<JobApplicationDto>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  const conditions: SQL[] = [];
  if (filters.jobId) conditions.push(eq(jobApplication.jobId, filters.jobId));
  if (filters.status) conditions.push(eq(jobApplication.status, filters.status as never));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    joinedApplicationQuery(where)
      .orderBy(desc(jobApplication.appliedAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(jobApplication).where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return {
    items: rows.map((row) => toApplicationDto(flattenApplicationRow(row))),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getJobApplication(applicationId: string): Promise<JobApplicationDto | null> {
  const rows = await joinedApplicationQuery(eq(jobApplication.id, applicationId)).limit(1);
  const row = rows[0];
  return row ? toApplicationDto(flattenApplicationRow(row)) : null;
}

export async function listApplicationsForUser(userId: string): Promise<JobApplicationDto[]> {
  const rows = await joinedApplicationQuery(eq(jobApplication.userId, userId)).orderBy(
    desc(jobApplication.appliedAt),
  );
  return rows.map((row) => toApplicationDto(flattenApplicationRow(row)));
}

export async function createApplication(
  jobId: string,
  userId: string,
  input: CreateJobApplicationInput,
): Promise<JobApplicationDto> {
  const postings = await db.select().from(jobPosting).where(eq(jobPosting.id, jobId)).limit(1);
  const posting = postings[0];
  if (!posting)
    throw new JobServiceError(problem("not-found", 404, "Not found", "Job posting not found"));
  if (posting.status !== "PUBLISHED") {
    throw new JobServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        "This job is not accepting applications",
      ),
    );
  }
  if (posting.applicationDeadline && posting.applicationDeadline.getTime() < Date.now()) {
    throw new JobServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        "The application deadline for this job has passed",
      ),
    );
  }

  const created = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: jobApplication.id })
      .from(jobApplication)
      .where(and(eq(jobApplication.jobId, jobId), eq(jobApplication.userId, userId)))
      .limit(1);
    if (existing.length > 0) {
      throw new JobServiceError(
        problem("conflict", 409, "Conflict", "You have already applied to this job"),
      );
    }

    const [application] = await tx
      .insert(jobApplication)
      .values({
        jobId,
        userId,
        coverLetter: input.coverLetter,
        portfolioUrl: input.portfolioUrl,
        salaryExpectation:
          input.salaryExpectation !== undefined ? String(input.salaryExpectation) : null,
        availability: input.availability,
      })
      .returning();

    await tx
      .update(jobPosting)
      .set({ applicationCount: sql`${jobPosting.applicationCount} + 1` })
      .where(eq(jobPosting.id, jobId));

    return application!;
  });

  const dto = await getJobApplication(created.id);
  if (!dto) {
    throw new JobServiceError(
      problem("not-found", 404, "Not found", "Application disappeared after insert"),
    );
  }
  return dto;
}

export async function updateApplicationStatus(
  applicationId: string,
  input: UpdateApplicationStatusInput,
  actor: { id: string; privileged: boolean },
): Promise<JobApplicationDto> {
  const rows = await db
    .select()
    .from(jobApplication)
    .where(eq(jobApplication.id, applicationId))
    .limit(1);
  const current = rows[0];
  if (!current) {
    throw new JobServiceError(problem("not-found", 404, "Not found", "Job application not found"));
  }

  if (!actor.privileged) {
    // Applicants may only withdraw their own application.
    if (current.userId !== actor.id) {
      throw new JobServiceError(
        problem(
          "insufficient-permission",
          403,
          "Insufficient permission",
          "You can only update your own application",
        ),
      );
    }
    if (input.status !== SELF_SERVICE_TRANSITION) {
      throw new JobServiceError(
        problem(
          "insufficient-permission",
          403,
          "Insufficient permission",
          "Applicants can only withdraw their own application",
        ),
      );
    }
  }

  const allowed = APPLICATION_STATUS_TRANSITIONS[current.status];
  if (!allowed.includes(input.status)) {
    throw new JobServiceError(
      problem(
        "conflict",
        409,
        "Conflict",
        `Cannot transition application from ${current.status} to ${input.status}`,
      ),
    );
  }

  await db
    .update(jobApplication)
    .set({ status: input.status, ...(input.notes !== undefined ? { notes: input.notes } : {}) })
    .where(eq(jobApplication.id, applicationId));

  const dto = await getJobApplication(applicationId);
  if (!dto) {
    throw new JobServiceError(
      problem("not-found", 404, "Not found", "Application disappeared after update"),
    );
  }
  return dto;
}

// ---------------------------------------------------------------------------
// Public board (published postings only)
// ---------------------------------------------------------------------------

export interface PublicJobFilters {
  q?: string;
  typeName?: string;
  page?: number;
  limit?: number;
}

export async function listPublicJobPostings(
  filters: PublicJobFilters = {},
): Promise<Paginated<JobPostingDto>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  const conditions: SQL[] = [
    eq(jobPosting.status, "PUBLISHED"),
    // Hide postings whose application deadline has passed.
    or(isNull(jobPosting.applicationDeadline), gt(jobPosting.applicationDeadline, new Date()))!,
  ];
  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(or(ilike(jobPosting.title, term), ilike(company.displayName, term))!);
  }
  if (filters.typeName) {
    conditions.push(eq(jobType.name, filters.typeName));
  }
  const where = and(...conditions);

  const [rows, totalResult] = await Promise.all([
    joinedPostingQuery(where)
      .orderBy(desc(jobPosting.isFeatured), desc(jobPosting.publishedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(jobPosting)
      .innerJoin(jobType, eq(jobPosting.typeId, jobType.id))
      .innerJoin(company, eq(jobPosting.companyId, company.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return {
    items: rows.map((row) => toPostingDto(flattenPostingRow(row))),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getPublicJobPosting(id: string): Promise<JobPostingDto | null> {
  const dto = await getJobPosting(id);
  if (!dto || dto.status !== "PUBLISHED") return null;

  // Best-effort view counter; a failure here must never break the page.
  try {
    await db
      .update(jobPosting)
      .set({ viewCount: sql`${jobPosting.viewCount} + 1` })
      .where(eq(jobPosting.id, id));
  } catch (error) {
    logger.error("Failed to increment job view count", error);
  }

  return { ...dto, viewCount: dto.viewCount + 1 };
}

/**
 * Public detail lookup by URL slug (the public board links to /jobs/<slug>).
 * Returns only PUBLISHED postings and best-effort increments the view count.
 */
export async function getPublicJobPostingBySlug(slug: string): Promise<JobPostingDto | null> {
  const rows = await joinedPostingQuery(
    and(eq(jobPosting.slug, slug), eq(jobPosting.status, "PUBLISHED")),
  ).limit(1);
  const row = rows[0];
  if (!row) return null;

  const dto = toPostingDto(flattenPostingRow(row));

  // Best-effort view counter; a failure here must never break the page.
  try {
    await db
      .update(jobPosting)
      .set({ viewCount: sql`${jobPosting.viewCount} + 1` })
      .where(eq(jobPosting.id, dto.id));
  } catch (error) {
    logger.error("Failed to increment job view count", error);
  }

  return { ...dto, viewCount: dto.viewCount + 1 };
}
