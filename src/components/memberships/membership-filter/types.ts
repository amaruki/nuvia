import type { MembershipFilter } from "@/types/membership.types";

export interface MembershipFilterProps {
  filters: MembershipFilter;
  onFiltersChange: (filters: MembershipFilter) => void;
  isLoading?: boolean;
}
