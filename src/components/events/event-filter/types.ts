import { z } from "zod";
import type { EventFilter } from "@/types/event";

export const eventFilterSchema = z.object({
  searchQuery: z.string().optional(),
  status: z.array(z.string()).optional(),
  eventType: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  organizerId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isVirtual: z.boolean().optional(),
  isInPerson: z.boolean().optional(),
});

export type EventFilterForm = z.infer<typeof eventFilterSchema>;

export interface EventFilterProps {
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  onClearFilters: () => void;
  className?: string;
}

/** Discriminates which filter group an active-filter chip belongs to. */
export type FilterChipKind = "status" | "eventType" | "tag" | "format";
