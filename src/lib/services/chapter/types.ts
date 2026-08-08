/**
 * Shared chapter service types — DB enum spellings, row shapes, and the
 * list/pagination contract.
 */

import { chapter, chapterMember } from "@/db/schema";

// ---------------------------------------------------------------------------
// DB enums (SCREAMING_SNAKE; the UI uses lowercase — see mappers/membership)
// ---------------------------------------------------------------------------

export type DbChapterStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
export type DbChapterRole =
  | "PRESIDENT"
  | "VICE_PRESIDENT"
  | "SECRETARY"
  | "TREASURER"
  | "ADMIN"
  | "MEMBER";

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export type ChapterRow = typeof chapter.$inferSelect;
export type ChapterMemberRow = typeof chapterMember.$inferSelect;

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export interface ChapterListFilters {
  /** Comma-separated UI status values, e.g. "active,pending". */
  status?: string;
  /** Comma-separated region names. */
  region?: string;
  /** Comma-separated country names. */
  country?: string;
  search?: string;
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
