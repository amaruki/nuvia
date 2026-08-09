import type { UserFilter } from "@/types/user-management.types";

// Matches the original inline formatting: only the first underscore becomes a
// space, so "two_factor_enabled" renders as "Two factor_enabled".
export function formatFilterLabel(value: string): string {
  const spaced = value.replace("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function getActiveFiltersCount(filters: UserFilter): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.roles?.length) count++;
  if (filters.statuses?.length) count++;
  if (filters.authStatuses?.length) count++;
  if (filters.emailVerified !== undefined) count++;
  return count;
}
