import { eq, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { company, jobCategory, jobPosting, jobType, location } from "@/db/schema";

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export type WhereClause = SQL | undefined;

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

export function paginate(
  page?: number,
  limit?: number,
): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export function joinedPostingQuery(where: WhereClause) {
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
