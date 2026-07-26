/**
 * Utility functions for event-related operations
 */

import { EventStatus, EventType } from "@/types/event.types";

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
