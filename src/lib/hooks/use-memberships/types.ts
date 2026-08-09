import type { MembershipFilter, MembershipProfile, MembershipSort } from "@/types/membership.types";

export interface UseMembershipsOptions {
  initialFilters?: MembershipFilter;
  initialSort?: MembershipSort;
  pageSize?: number;
}

export interface UseMembershipsReturn {
  members: MembershipProfile[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: MembershipFilter;
  sort: MembershipSort;
  updateFilters: (filters: MembershipFilter) => void;
  updateSort: (sort: MembershipSort) => void;
  setPage: (page: number) => void;
  refresh: () => void;
  reset: () => void;
}
