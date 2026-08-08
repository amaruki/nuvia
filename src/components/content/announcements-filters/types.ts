import type { AnnouncementFilters } from "@/types/announcement";

export interface FiltersControlProps {
  filters: AnnouncementFilters;
  onFiltersChange: (filters: Partial<AnnouncementFilters>) => void;
}

export interface AnnouncementsFiltersProps {
  filters: AnnouncementFilters;
  onFiltersChange: (filters: AnnouncementFilters) => void;
  onReset: () => void;
}
