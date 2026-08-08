import type { PublicationFilters } from "@/types/publication.types";

export interface FiltersControlProps {
  filters: PublicationFilters;
  onFiltersChange: (filters: Partial<PublicationFilters>) => void;
}

export interface PublicationsFiltersProps {
  filters: PublicationFilters;
  onFiltersChange: (filters: Partial<PublicationFilters>) => void;
  onClearFilters: () => void;
}
