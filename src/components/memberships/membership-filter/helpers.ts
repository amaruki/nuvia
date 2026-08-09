import type { MembershipFilter } from "@/types/membership.types";

export function getActiveFilterCount(filters: MembershipFilter): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.tiers?.length) count++;
  if (filters.statuses?.length) count++;
  if (filters.locations?.length) count++;
  if (filters.committees?.length) count++;
  if (filters.startDateRange) count++;
  if (filters.endDateRange) count++;
  return count;
}
