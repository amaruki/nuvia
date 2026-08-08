import type { AnnouncementFilters } from "@/types/announcement.types";

export interface FiltersControlProps {
  filters: AnnouncementFilters;
  onFiltersChange: (filters: Partial<AnnouncementFilters>) => void;
}

export interface AnnouncementsFiltersProps {
  filters: AnnouncementFilters;
  onFiltersChange: (filters: AnnouncementFilters) => void;
  onReset: () => void;
}
