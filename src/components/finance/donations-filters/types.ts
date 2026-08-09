import type { DonationFilterOptions } from "@/types/finance";

export interface DonationsFiltersProps {
  filters: DonationFilterOptions;
  onFiltersChange: (filters: Partial<DonationFilterOptions>) => void;
  onClearFilters: () => void;
}

export interface FilterOption {
  value: string;
  label: string;
}

export type ArrayFilterKey = "status" | "donorType" | "donationType" | "campaign";

export interface CheckboxFilterGroupProps {
  label: string;
  idPrefix: string;
  options: FilterOption[];
  selected?: string[];
  onToggle: (value: string, checked: boolean) => void;
}

export interface DateRangeFilterProps {
  initialStart?: Date;
  initialEnd?: Date;
  onRangeChange: (range: { start?: Date; end?: Date }) => void;
}

export interface AmountRangeFilterProps {
  amountRange?: DonationFilterOptions["amountRange"];
  onFiltersChange: (filters: Partial<DonationFilterOptions>) => void;
}

export interface ActiveFiltersSummaryProps {
  filters: DonationFilterOptions;
}
