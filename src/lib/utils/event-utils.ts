/**
 * Utility functions for event-related operations
 */

import { EventStatus, EventType, RegistrationStatus } from "@/types/event";

// ---------------------------------------------------------------------------
// DB <-> UI enum translation (backlog B2)
//
// The event tables store uppercase enum values (src/db/schema/enums.ts) while
// the UI types use lowercase values (src/types/event/). The tables
// below are the single translation point between the two vocabularies.
//
// The Db* unions mirror src/db/schema/enums.ts by hand: this module is
// client-safe and the drizzle schema modules must not enter the client
// bundle. Keep them in sync with the schema if it ever changes.
// ---------------------------------------------------------------------------

export type DbEventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "POSTPONED";

export type DbEventType =
  | "CONFERENCE"
  | "MEETUP"
  | "WORKSHOP"
  | "WEBINAR"
  | "NETWORKING"
  | "SOCIAL"
  | "TRAINING"
  | "PANEL_DISCUSSION"
  | "KEYNOTE"
  | "OTHER";

export type DbEventFormat = "IN_PERSON" | "VIRTUAL" | "HYBRID" | "RECORDED" | "LIVE_STREAM";

export type DbRegistrationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "WAITLISTED"
  | "CANCELED"
  | "ATTENDED"
  | "NO_SHOW";

/**
 * DB status -> UI status. The UI has four buckets; every DB lifecycle state
 * that is neither draft, completed, nor canceled reads as "published".
 */
export const DB_TO_UI_EVENT_STATUS: Record<DbEventStatus, EventStatus> = {
  DRAFT: EventStatus.DRAFT,
  PUBLISHED: EventStatus.PUBLISHED,
  REGISTRATION_OPEN: EventStatus.PUBLISHED,
  REGISTRATION_CLOSED: EventStatus.PUBLISHED,
  IN_PROGRESS: EventStatus.PUBLISHED,
  POSTPONED: EventStatus.PUBLISHED,
  COMPLETED: EventStatus.COMPLETED,
  CANCELED: EventStatus.CANCELLED,
};

/** UI status -> DB statuses that satisfy it in a query. */
export const UI_TO_DB_EVENT_STATUS: Record<EventStatus, DbEventStatus[]> = {
  [EventStatus.DRAFT]: ["DRAFT"],
  [EventStatus.PUBLISHED]: [
    "PUBLISHED",
    "REGISTRATION_OPEN",
    "REGISTRATION_CLOSED",
    "IN_PROGRESS",
    "POSTPONED",
  ],
  [EventStatus.CANCELLED]: ["CANCELED"],
  [EventStatus.COMPLETED]: ["COMPLETED"],
};

/**
 * DB type -> UI type. DB types without a UI counterpart fold into "other" —
 * widening the UI enum is a separate decision.
 */
export const DB_TO_UI_EVENT_TYPE: Record<DbEventType, EventType> = {
  CONFERENCE: EventType.CONFERENCE,
  MEETUP: EventType.MEETUP,
  WORKSHOP: EventType.WORKSHOP,
  WEBINAR: EventType.WEBINAR,
  SOCIAL: EventType.SOCIAL,
  TRAINING: EventType.TRAINING,
  NETWORKING: EventType.OTHER,
  PANEL_DISCUSSION: EventType.OTHER,
  KEYNOTE: EventType.OTHER,
  OTHER: EventType.OTHER,
};

/** UI type -> DB types that satisfy it in a query. */
export const UI_TO_DB_EVENT_TYPE: Record<EventType, DbEventType[]> = {
  [EventType.CONFERENCE]: ["CONFERENCE"],
  [EventType.MEETUP]: ["MEETUP"],
  [EventType.WORKSHOP]: ["WORKSHOP"],
  [EventType.WEBINAR]: ["WEBINAR"],
  [EventType.SOCIAL]: ["SOCIAL"],
  [EventType.TRAINING]: ["TRAINING"],
  [EventType.OTHER]: ["NETWORKING", "PANEL_DISCUSSION", "KEYNOTE", "OTHER"],
};

/**
 * DB registration status -> UI registration status. ATTENDED counts as
 * confirmed, NO_SHOW as cancelled — the UI has no finer buckets.
 */
export const DB_TO_UI_REGISTRATION_STATUS: Record<DbRegistrationStatus, RegistrationStatus> = {
  PENDING: RegistrationStatus.PENDING,
  CONFIRMED: RegistrationStatus.CONFIRMED,
  WAITLISTED: RegistrationStatus.WAITLISTED,
  CANCELED: RegistrationStatus.CANCELLED,
  ATTENDED: RegistrationStatus.CONFIRMED,
  NO_SHOW: RegistrationStatus.CANCELLED,
};

/** Formats that involve a physical venue — used to translate isInPerson filters. */
export const IN_PERSON_EVENT_FORMATS: DbEventFormat[] = ["IN_PERSON", "HYBRID"];

/** Formats with no physical venue — used to translate isInPerson filters. */
export const REMOTE_EVENT_FORMATS: DbEventFormat[] = ["VIRTUAL", "RECORDED", "LIVE_STREAM"];

/**
 * Get the color class for an event type badge
 */
export function getEventTypeColor(eventType: EventType): string {
  switch (eventType) {
    case EventType.WORKSHOP:
      return "bg-blue-100 text-blue-800";
    case EventType.MEETUP:
      return "bg-green-100 text-green-800";
    case EventType.CONFERENCE:
      return "bg-purple-100 text-purple-800";
    case EventType.WEBINAR:
      return "bg-indigo-100 text-indigo-800";
    case EventType.SOCIAL:
      return "bg-yellow-100 text-yellow-800";
    case EventType.TRAINING:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-foreground/80";
  }
}

/**
 * Get the color class for an event status badge
 */
export function getEventStatusColor(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return "bg-gray-100 text-foreground/80";
    case EventStatus.PUBLISHED:
      return "bg-green-100 text-green-800";
    case EventStatus.CANCELLED:
      return "bg-red-100 text-red-800";
    case EventStatus.COMPLETED:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-foreground/80";
  }
}

/**
 * Format a date for display in events
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format a date with full weekday name for event details
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format time for display in events
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Check if an event is upcoming
 */
export function isEventUpcoming(startDate: Date): boolean {
  return new Date(startDate) > new Date();
}

/**
 * Check if an event is today
 */
export function isEventToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if an event is tomorrow
 */
export function isEventTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Check if event registration is still open
 */
export function isRegistrationOpen(startDate: Date, registrationDeadline?: Date): boolean {
  if (registrationDeadline) {
    return new Date() < new Date(registrationDeadline);
  }
  return new Date() < new Date(startDate);
}

/**
 * Check if an event is at full capacity
 */
export function isEventFull(currentAttendees: number, maxAttendees?: number): boolean {
  return maxAttendees !== undefined && currentAttendees >= maxAttendees;
}

/**
 * The registration card's banner/form state for an event page, derived from
 * isRegistrationOpen() and isEventFull().
 *
 * - "open": registration open with capacity; show the registration form.
 * - "full": registration open but at capacity; show the "Event Full" banner
 *   plus the waitlist form.
 * - "closed": registration closed; show the "Registration Closed" banner and
 *   hide the form regardless of remaining capacity.
 */
export type RegistrationFormState = "open" | "full" | "closed";

export function getRegistrationFormState(
  registrationOpen: boolean,
  eventFull: boolean,
): RegistrationFormState {
  if (!registrationOpen) return "closed";
  if (eventFull) return "full";
  return "open";
}

/**
 * Get event status text with proper formatting
 */
export function formatEventStatus(status: EventStatus): string {
  return status.replace("_", " ");
}

/**
 * Get event type text with proper formatting
 */
export function formatEventType(eventType: EventType): string {
  return eventType.replace("_", " ");
}

/**
 * Get time range string for an event
 */
export function formatEventTimeRange(startDate: Date, endDate: Date): string {
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}

/**
 * Get event date and time string for display
 */
export function formatEventDateTime(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate)} • ${formatEventTimeRange(startDate, endDate)}`;
}
