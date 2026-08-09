import type {
  CategoryFilters,
  CategoryScope,
  CategoryStatus,
  CategoryType,
} from "@/types/category.types";

export interface CategoriesFiltersProps {
  filters: CategoryFilters;
  onFiltersChange: (filters: Partial<CategoryFilters>) => void;
  onReset: () => void;
}

export interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export interface TypeFilterProps {
  selected?: CategoryType[];
  onToggle: (type: CategoryType, checked: boolean) => void;
}

export interface StatusFilterProps {
  selected?: CategoryStatus[];
  onToggle: (status: CategoryStatus, checked: boolean) => void;
}

export interface ScopeFilterProps {
  selected?: CategoryScope[];
  onToggle: (scope: CategoryScope, checked: boolean) => void;
}

export interface SortOptionsProps {
  sortBy?: CategoryFilters["sortBy"];
  sortOrder?: CategoryFilters["sortOrder"];
  onSortByChange: (value: NonNullable<CategoryFilters["sortBy"]>) => void;
  onSortOrderChange: (value: NonNullable<CategoryFilters["sortOrder"]>) => void;
}

export type ActiveFilterKey = "search" | "type" | "status" | "scope";

export interface ActiveFiltersBarProps {
  filters: CategoryFilters;
  onRemoveFilter: (filterType: ActiveFilterKey) => void;
}
