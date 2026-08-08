import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { company, jobPosting } from "@/db/schema";
import type { JobPostingDto } from "@/types/jobs.types";
import { flattenPostingRow, toPostingDto } from "./mappers";
import {
  joinedPostingQuery,
  paginate,
  type Paginated,
  type PostingListFilters,
} from "./query-helpers";

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
