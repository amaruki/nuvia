import type { GatewayFilterOptions } from "@/types/finance";

export interface GatewaysFiltersProps {
  filters: GatewayFilterOptions;
  onFiltersChange: (filters: Partial<GatewayFilterOptions>) => void;
  onClearFilters: () => void;
}

export interface FilterOption {
  value: string;
  label: string;
}

export type ArrayFilterKey = "status" | "provider" | "environment" | "currency";

export interface CheckboxFilterGroupProps {
  label: string;
  idPrefix: string;
  options: FilterOption[];
  selected?: string[];
  listClassName?: string;
  clearLabel?: string;
  onToggle: (value: string, checked: boolean) => void;
  onClear?: () => void;
}

export interface CurrencyFilterProps {
  options: FilterOption[];
  selected?: string[];
  onToggle: (value: string, checked: boolean) => void;
  onClear: () => void;
}
