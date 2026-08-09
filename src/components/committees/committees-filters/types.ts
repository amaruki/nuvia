import type {
  CommitteeAuthorityLevel,
  CommitteeFilterOptions,
  CommitteeStatus,
  CommitteeType,
} from "@/types/committee";

export interface CommitteesFiltersProps {
  filters: CommitteeFilterOptions;
  onFiltersChange: (filters: Partial<CommitteeFilterOptions>) => void;
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
  idPrefix: string;
  options: FilterOption<T>[];
  selected?: T[];
  onToggle: (value: T, checked: boolean) => void;
}

export interface MemberCountFilterProps {
  range?: MemberCountRange;
  onChange: (range: MemberCountRange) => void;
}

export interface ActiveFiltersSummaryProps {
  filters: CommitteeFilterOptions;
  onFiltersChange: (filters: Partial<CommitteeFilterOptions>) => void;
  onStatusToggle: (status: CommitteeStatus, checked: boolean) => void;
  onTypeToggle: (type: CommitteeType, checked: boolean) => void;
  onAuthorityToggle: (authority: CommitteeAuthorityLevel, checked: boolean) => void;
}
