import type { MediaFilters } from "@/types/media";

export interface MediaFiltersProps {
  filters: MediaFilters;
  onFiltersChange: (filters: MediaFilters) => void;
  onClearFilters: () => void;
  className?: string;
}

export interface FilterControlProps {
  filters: MediaFilters;
  onFiltersChange: (filters: MediaFilters) => void;
}
