// Event component prop types for Nuvia community platform

import { Event } from "./event";
import { EventFilter } from "./filters";
import { RegisterForEventRequest } from "./requests";

export interface EventCardProps {
  event: Event;
  isRegistered?: boolean;
  showRegistrationStatus?: boolean;
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  className?: string;
}

export interface EventListProps {
  events: Event[];
  isLoading?: boolean;
  error?: string;
  filter?: EventFilter;
  onFilterChange?: (filter: EventFilter) => void;
  onSortChange?: (sort: "asc" | "desc") => void;
  onCreateEvent?: () => void;
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  showCreateButton?: boolean;
  showRegistrationStatus?: boolean;
  className?: string;
}

export interface EventLayoutProps {
  event: Event;
  isRegistered?: boolean;
  onRegister?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  showActions?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface EventRegistrationFormProps {
  event: Event;
  onSubmit: (data: RegisterForEventRequest) => void;
  isSubmitting?: boolean;
  className?: string;
}

export interface EventListLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
