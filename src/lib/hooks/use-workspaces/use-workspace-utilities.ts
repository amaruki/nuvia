import type { WorkspaceFilterOptions } from "@/types/committee";

import { WORKSPACES_API_PATH, WORKSPACES_PAGE_LIMIT } from "./constants";

/** Builds the /api/v1/workspaces list URL from the active dashboard filters. */
export function workspacesQueryPath(filters: WorkspaceFilterOptions): string {
  const params = new URLSearchParams({ limit: String(WORKSPACES_PAGE_LIMIT) });
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.type && filters.type.length > 0) params.set("type", filters.type.join(","));
  if (filters.memberRole && filters.memberRole.length > 0) {
    params.set("memberRole", filters.memberRole.join(","));
  }
  if (filters.dateRange) {
    params.set("createdAfter", filters.dateRange.start.toISOString());
    params.set("createdBefore", filters.dateRange.end.toISOString());
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  return `${WORKSPACES_API_PATH}?${params.toString()}`;
}
