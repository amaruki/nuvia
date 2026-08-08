// Event hook result types for Nuvia community platform

import { Event } from "./event";
import { EventFilter } from "./filters";
import { EventListResponse, EventDetailsResponse } from "./responses";

export interface UseEventsResult {
  events: Event[];
  data: EventListResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseEventResult {
  event: Event | null;
  data: EventDetailsResponse | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseEventFiltersResult {
  filters: EventFilter;
  updateFilter: (key: keyof EventFilter, value: any) => void;
  addFilterValue: (key: keyof EventFilter, value: any) => void;
  removeFilterValue: (key: keyof EventFilter, value: any) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}
