import type { MembershipFilter, MembershipProfile, MembershipSort } from "@/types/membership.types";

export interface UseMembershipsOptions {
  initialFilters?: MembershipFilter;
  initialSort?: MembershipSort;
  pageSize?: number;
}

export interface UseMembershipsReturn {
  members: MembershipProfile[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  filters: MembershipFilter;
  sort: MembershipSort;
  page: number;
  updateFilters: (filters: MembershipFilter) => void;
  updateSort: (sort: MembershipSort) => void;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
}
