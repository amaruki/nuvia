import { and, count, desc, eq, gt, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { company, jobPosting, jobType } from "@/db/schema";
import { logger } from "@/lib/logger";
import type { JobPostingDto } from "@/types/jobs.types";
import { flattenPostingRow, toPostingDto } from "./mappers";
import { getJobPosting } from "./posting-queries";
import { joinedPostingQuery, paginate, type Paginated } from "./query-helpers";

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
