import type { MembershipFilter, MembershipSort } from "@/types/membership.types";

export const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)", icon: "↑" },
  { value: "name-desc", label: "Name (Z-A)", icon: "↓" },
  { value: "membershipStartDate-desc", label: "Newest First", icon: "🆕" },
  { value: "membershipStartDate-asc", label: "Oldest First", icon: "📅" },
  { value: "membershipTier-asc", label: "Tier ↑", icon: "⭐" },
  { value: "membershipTier-desc", label: "Tier ↓", icon: "⭐" },
  { value: "location-asc", label: "Location (A-Z)", icon: "📍" },
  { value: "company-asc", label: "Company (A-Z)", icon: "🏢" },
];

export function parseSortValue(value: string): MembershipSort {
  const [field, direction] = value.split("-") as [MembershipSort["field"], "asc" | "desc"];
  return { field, direction };
}

export function countActiveFilters(filters: MembershipFilter): number {
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
