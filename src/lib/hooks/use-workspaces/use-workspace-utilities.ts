import type { WorkspaceFilterOptions } from "@/types/committee";

/** Maps dashboard workspace filters onto /api/v1/workspaces query params. */
export function workspaceFilterParams(filters: WorkspaceFilterOptions): URLSearchParams {
  const params = new URLSearchParams();
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
  return params;
}
