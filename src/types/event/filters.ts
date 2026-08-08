// Event filter types for Nuvia community platform

import { EventStatus, EventType } from "./enums";

export interface EventFilter {
  status?: EventStatus[];
  eventType?: EventType[];
  startDate?: Date;
  endDate?: Date;
  organizerId?: string;
  tags?: string[];
  isVirtual?: boolean;
  isInPerson?: boolean;
  searchQuery?: string;
}
