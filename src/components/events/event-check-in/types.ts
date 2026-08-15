import { Event, EventRegistration } from "@/types/event";
import type { EventCheckInInput } from "@/lib/validation/event.validation";

export interface EventCheckInProps {
  event: Event;
  onCheckIn: (data: EventCheckInInput) => void;
  onSearchRegistration?: (searchTerm: string) => void;
  isSubmitting?: boolean;
  searchResults?: EventRegistration[];
  className?: string;
}
