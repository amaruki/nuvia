import type { MembershipFilter, MembershipProfile, MembershipSort } from "@/types/membership.types";

export interface MembershipListProps {
  members: MembershipProfile[];
  isLoading: boolean;
  total: number;
  filters: MembershipFilter;
  sort: MembershipSort;
  onSortChange: (sort: MembershipSort) => void;
  onClearFilters?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}
