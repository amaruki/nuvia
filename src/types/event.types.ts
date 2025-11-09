// Event types for Nuvia community platform

import { SafeUser } from './auth.types';

// Event status enum
export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Event type enum
export enum EventType {
  WORKSHOP = 'workshop',
  MEETUP = 'meetup',
  CONFERENCE = 'conference',
  WEBINAR = 'webinar',
  SOCIAL = 'social',
  TRAINING = 'training',
  OTHER = 'other',
}

// Registration status enum
export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  WAITLISTED = 'waitlisted',
}

// Event interface
export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  eventType: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  location: string;
  virtualEventUrl?: string;
  isVirtual: boolean;
  isInPerson: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  registrationDeadline?: Date;
  organizerId: string;
  organizer?: SafeUser;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Event registration interface
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  user?: SafeUser;
  status: RegistrationStatus;
  registeredAt: Date;
  checkedInAt?: Date;
  checkInMethod?: 'qr' | 'manual' | 'app';
  certificateIssued: boolean;
  certificateUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event certificate interface
export interface EventCertificate {
  id: string;
  eventId: string;
  event?: Event;
  userId: string;
  user?: SafeUser;
  issuedAt: Date;
  certificateUrl: string;
  verificationCode: string;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event check-in interface
export interface EventCheckIn {
  id: string;
  eventId: string;
  event?: Event;
  registrationId: string;
  registration?: EventRegistration;
  userId: string;
  user?: SafeUser;
  checkedInAt: Date;
  checkedInBy: string; // User ID of who performed the check-in
  checkInMethod: 'qr' | 'manual' | 'app';
  ipAddress?: string;
  location?: string;
  createdAt: Date;
}

// Event filter interface
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

// Event creation request
export interface CreateEventRequest {
  title: string;
  description: string;
  shortDescription?: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  location: string;
  virtualEventUrl?: string;
  isVirtual: boolean;
  isInPerson: boolean;
  maxAttendees?: number;
  registrationDeadline?: Date;
  coverImage?: string;
  tags: string[];
}

// Event update request
export interface UpdateEventRequest {
  title?: string;
  description?: string;
  shortDescription?: string;
  eventType?: EventType;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  virtualEventUrl?: string;
  isVirtual?: boolean;
  isInPerson?: boolean;
  maxAttendees?: number;
  registrationDeadline?: Date;
  status?: EventStatus;
  coverImage?: string;
  tags?: string[];
}

// Event registration request
export interface RegisterForEventRequest {
  eventId: string;
  notes?: string;
}

// Event check-in request
export interface CheckInToEventRequest {
  eventId: string;
  registrationId?: string;
  checkInMethod: 'qr' | 'manual' | 'app';
  verificationCode?: string; // For QR code check-ins
}

// Event statistics interface
export interface EventStatistics {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  averageAttendanceRate: number;
  popularEventTypes: {
    eventType: EventType;
    count: number;
  }[];
  monthlyStats: {
    month: string;
    events: number;
    registrations: number;
  }[];
}

// Event dashboard data interface
export interface EventDashboardData {
  upcomingEvents: Event[];
  myEvents: Event[]; // Events organized by the current user
  myRegistrations: {
    event: Event;
    registration: EventRegistration;
  }[];
  eventStatistics: EventStatistics;
}

// Event list response
export interface EventListResponse {
  events: Event[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Event details response
export interface EventDetailsResponse {
  event: Event;
  isRegistered: boolean;
  registration?: EventRegistration;
  organizerEvents: Event[]; // Other events by the same organizer
  similarEvents: Event[];
}

// Event registration response
export interface EventRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    registration: EventRegistration;
    event: Event;
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: Date;
    version: string;
  };
}

// Event check-in response
export interface EventCheckInResponse {
  success: boolean;
  message: string;
  data?: {
    checkIn: EventCheckIn;
    registration: EventRegistration;
    certificate?: EventCertificate;
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: Date;
    version: string;
  };
}

// Additional types for better type safety

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

// Hook types
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

// Action types
export interface CreateEventActionResult {
  success: boolean;
  data?: Event;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface UpdateEventActionResult {
  success: boolean;
  data?: Event;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface DeleteEventActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface RegisterForEventActionResult {
  success: boolean;
  data?: EventRegistrationResponse;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CancelEventRegistrationActionResult {
  success: boolean;
  data?: EventRegistrationResponse;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CheckInToEventActionResult {
  success: boolean;
  data?: EventCheckInResponse;
  message?: string;
  errors?: Record<string, string[]>;
}