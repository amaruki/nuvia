import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { company, jobApplication, jobCategory, jobPosting, jobType, location } from "@/db/schema";
import { problem } from "@/lib/http";
import type { JobPostingDto } from "@/types/jobs.types";
import type { CreateJobPostingInput, UpdateJobPostingInput } from "../job.schemas";
import { JobServiceError } from "./errors";
import { getJobPosting } from "./posting-queries";

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
