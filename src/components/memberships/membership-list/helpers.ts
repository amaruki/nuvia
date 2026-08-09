import type { MembershipFilter, MembershipSort } from "@/types/membership.types";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  CalendarClock,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";

/** Sort options for the membership list (UI-13): lucide icons, no emoji. */
export const SORT_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "name-asc", label: "Name (A-Z)", icon: ArrowUpAZ },
  { value: "name-desc", label: "Name (Z-A)", icon: ArrowDownAZ },
  { value: "membershipStartDate-desc", label: "Newest First", icon: Sparkles },
  { value: "membershipStartDate-asc", label: "Oldest First", icon: CalendarClock },
  { value: "membershipTier-asc", label: "Tier ↑", icon: Star },
  { value: "membershipTier-desc", label: "Tier ↓", icon: Star },
  { value: "location-asc", label: "Location (A-Z)", icon: MapPin },
  { value: "company-asc", label: "Company (A-Z)", icon: Building2 },
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
