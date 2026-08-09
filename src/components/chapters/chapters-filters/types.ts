import type { ReactNode } from "react";
import type { ChapterFilterOptions } from "@/types/chapter.types";

export interface ChaptersFiltersProps {
  filters: ChapterFilterOptions;
  onFiltersChange: (filters: Partial<ChapterFilterOptions>) => void;
  onClearFilters: () => void;
}

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export interface MemberCountRange {
  min: number;
  max: number;
}

export interface CheckboxFilterGroupProps<T extends string = string> {
  label: string;
  icon: ReactNode;
  idPrefix: string;
  options: FilterOption<T>[];
  selected?: T[];
  onToggle: (value: T, checked: boolean) => void;
}

export interface MemberCountFilterProps {
  range?: MemberCountRange;
  onChange: (range: MemberCountRange) => void;
}

export interface FilterActionsBarProps {
  activeCount: number;
  onClearFilters: () => void;
}
