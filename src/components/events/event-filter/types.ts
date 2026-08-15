import type { EventFilter } from "@/types/event";

// The filter panel's form schema lives in the domain validation module
// (CODING_STANDARD 3.2); the type is re-exported here so existing
// "./types" imports in this folder keep working.
export type { EventFilterForm } from "@/lib/validation/event.validation";

export interface EventFilterProps {
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  onClearFilters: () => void;
  className?: string;
}

/** Discriminates which filter group an active-filter chip belongs to. */
export type FilterChipKind = "status" | "eventType" | "tag" | "format";
