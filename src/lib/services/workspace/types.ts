/**
 * Shared workspace service types — DB enum spellings, the row shape, and
 * the list/pagination contract.
 */

import { workspace } from "@/db/schema";

// ---------------------------------------------------------------------------
// DB enums (SCREAMING_SNAKE; the UI uses lowercase — see helpers)
// ---------------------------------------------------------------------------

export type DbWorkspaceType = "GENERAL" | "PROJECT" | "DOCUMENT" | "DISCUSSION" | "MEETING";
export type DbWorkspaceStatus = "ACTIVE" | "ARCHIVED" | "LOCKED";

// ---------------------------------------------------------------------------
// Row shape
// ---------------------------------------------------------------------------

export type WorkspaceRow = typeof workspace.$inferSelect;

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export interface WorkspaceListFilters {
  /** Comma-separated UI status values, e.g. "active,locked". */
  status?: string;
  /** Comma-separated UI type values, e.g. "general,project". */
  type?: string;
  /** Comma-separated CommitteeRole values; matches workspaces whose roster holds the role. */
  memberRole?: string;
  /** ISO date bound (inclusive) on createdAt — the dashboard's date-range filter. */
  createdAfter?: string;
  createdBefore?: string;
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
