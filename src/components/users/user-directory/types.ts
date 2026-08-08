import type { UserFilter, UserProfile, UserSort, UserStats } from "@/types/user-management.types";

export interface UserDirectoryProps {
  users: UserProfile[];
  total: number;
  stats: UserStats;
  filters: UserFilter;
  sort: UserSort;
  isLoading: boolean;
  onFilterChange: (filters: UserFilter) => void;
  onSortChange: (sort: UserSort) => void;
  onClearFilters?: () => void;
  currentUserRole?: string;
  className?: string;
}

export interface UserDirectorySearchFilterBarProps {
  sort: UserSort;
  onSortChange: (sort: UserSort) => void;
  isGridView: boolean;
  onViewModeChange: (isGridView: boolean) => void;
  activeFiltersCount: number;
  onClearFilters?: () => void;
  shownCount: number;
  total: number;
}

export interface UserDirectoryGridViewProps {
  users: UserProfile[];
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  showSelection: boolean;
}

export interface UserDirectoryListViewProps {
  users: UserProfile[];
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sort: UserSort;
  onSort: (sort: UserSort) => void;
  showSelection: boolean;
}

export interface UserDirectoryLoadingSkeletonProps {
  className?: string;
}

export interface UserDirectoryEmptyStateProps {
  activeFiltersCount: number;
  onClearFilters?: () => void;
}
