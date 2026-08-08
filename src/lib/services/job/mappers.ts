import type { jobApplication, jobPosting } from "@/db/schema";
import type { JobApplicationDto, JobPostingDto } from "@/types/jobs.types";

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
export function flattenPostingRow(row: NestedPostingRow): PostingRow {
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

export function toPostingDto(row: PostingRow): JobPostingDto {
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

export type ApplicationRow = typeof jobApplication.$inferSelect & {
  jobTitle: string | null;
  applicantName: string;
  applicantEmail: string;
};

export function toApplicationDto(row: ApplicationRow): JobApplicationDto {
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
