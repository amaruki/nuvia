import type { MembershipFilter, MembershipProfile, MembershipSort } from "@/types/membership.types";

export interface MembershipListProps {
  members: MembershipProfile[];
  isLoading: boolean;
  isFetching?: boolean;
  total: number;
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
  filters: MembershipFilter;
  sort: MembershipSort;
  onSortChange: (sort: MembershipSort) => void;
  onClearFilters?: () => void;
  className?: string;
}
