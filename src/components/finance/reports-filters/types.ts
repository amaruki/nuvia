import type { ReportFilterOptions } from "@/types/finance";

export interface ReportsFiltersProps {
  filters: ReportFilterOptions;
  onFiltersChange: (filters: Partial<ReportFilterOptions>) => void;
  onClearFilters: () => void;
}

export interface FilterOption {
  value: string;
  label: string;
}

export type ArrayFilterKey = "type" | "status" | "period" | "generatedBy" | "tags";

export interface CheckboxFilterGroupProps {
  label: string;
  idPrefix: string;
  options: FilterOption[];
  selected?: string[];
  onToggle: (value: string, checked: boolean) => void;
}

export interface DateRangeFilterProps {
  start?: Date;
  end?: Date;
  onSelect: (type: "start" | "end", date?: Date) => void;
}

export interface TagsFilterProps {
  options: string[];
  selected?: string[];
  onToggle: (tag: string, checked: boolean) => void;
}
