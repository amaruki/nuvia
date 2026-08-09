import type {
  CommitteeRole,
  WorkspaceFilterOptions,
  WorkspaceStatus,
  WorkspaceType,
} from "@/types/committee";

export interface WorkspacesFiltersProps {
  filters: WorkspaceFilterOptions;
  onFiltersChange: (filters: Partial<WorkspaceFilterOptions>) => void;
  onClearFilters: () => void;
}

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export interface CheckboxFilterGroupProps<T extends string = string> {
  label: string;
  idPrefix: string;
  options: FilterOption<T>[];
  selected?: T[];
  onToggle: (value: T, checked: boolean) => void;
}

export interface DateRangeFilterProps {
  dateRange?: WorkspaceFilterOptions["dateRange"];
  onFieldChange: (field: "start" | "end", value: string) => void;
}

export interface ActiveFiltersSummaryProps {
  filters: WorkspaceFilterOptions;
  onFiltersChange: (filters: Partial<WorkspaceFilterOptions>) => void;
  onStatusRemove: (status: WorkspaceStatus) => void;
  onTypeRemove: (type: WorkspaceType) => void;
  onRoleRemove: (role: CommitteeRole) => void;
}
