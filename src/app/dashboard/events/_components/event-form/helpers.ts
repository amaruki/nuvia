import type { EventFormValues } from "@/lib/validation/event.validation";
import {
  EventStatus,
  EventType,
  type CreateEventRequest,
  type Event,
  type UpdateEventRequest,
} from "@/types/event";

/** Options for the event type select (values match the EventType enum). */
export const EVENT_TYPE_OPTIONS = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

/** Options for the edit-only status select (values match the EventStatus enum). */
export const EVENT_STATUS_OPTIONS = [
  { value: EventStatus.DRAFT, label: "Draft" },
  { value: EventStatus.PUBLISHED, label: "Published" },
  { value: EventStatus.CANCELLED, label: "Cancelled" },
  { value: EventStatus.COMPLETED, label: "Completed" },
];

/** Format a date for a `datetime-local` input field. */
export function formatDateForInput(date: Date): string {
  return new Date(date).toISOString().slice(0, 16);
}

/**
 * Form defaults for a brand-new event (create) or the seeded state for an
 * existing one (edit). Category stays empty in both modes: it is only
 * editable on create, and the edit payload never sends it.
 */
export function toFormState(event: Event | null): EventFormValues {
  return {
    title: event?.title ?? "",
    shortDescription: event?.shortDescription ?? "",
    description: event?.description ?? "",
    category: "",
    eventType: event?.eventType ?? EventType.WORKSHOP,
    status: event?.status ?? EventStatus.DRAFT,
    startDate: event ? formatDateForInput(event.startDate) : "",
    endDate: event ? formatDateForInput(event.endDate) : "",
    registrationDeadline: event?.registrationDeadline
      ? formatDateForInput(event.registrationDeadline)
      : "",
    location: event?.location ?? "",
    virtualEventUrl: event?.virtualEventUrl ?? "",
    isVirtual: event?.isVirtual ?? false,
    isInPerson: event?.isInPerson ?? true,
    maxAttendees: event?.maxAttendees ?? "",
    tags: event?.tags ?? [],
  };
}

/** Maps validated form values into the event service's create request. */
export function buildCreateEventRequest(values: EventFormValues): CreateEventRequest {
  return {
    title: values.title,
    description: values.description,
    shortDescription: values.shortDescription.trim() || undefined,
    category: values.category,
    eventType: values.eventType,
    startDate: new Date(values.startDate),
    endDate: new Date(values.endDate),
    location: values.location,
    virtualEventUrl: values.virtualEventUrl.trim() || undefined,
    isVirtual: values.isVirtual,
    isInPerson: values.isInPerson,
    maxAttendees: values.maxAttendees === "" ? undefined : values.maxAttendees,
    registrationDeadline: values.registrationDeadline
      ? new Date(values.registrationDeadline)
      : undefined,
    tags: values.tags,
  };
}

/**
 * Maps validated form values into the event service's update request.
 * PATCH semantics: optional fields left empty are sent as undefined so the
 * service omits them, matching the old edit page's behavior.
 */
export function buildUpdateEventRequest(values: EventFormValues): UpdateEventRequest {
  return {
    title: values.title,
    description: values.description,
    shortDescription: values.shortDescription.trim() || undefined,
    eventType: values.eventType,
    status: values.status,
    startDate: new Date(values.startDate),
    endDate: new Date(values.endDate),
    location: values.location,
    virtualEventUrl: values.virtualEventUrl.trim() || undefined,
    isVirtual: values.isVirtual,
    isInPerson: values.isInPerson,
    maxAttendees: values.maxAttendees === "" ? undefined : values.maxAttendees,
    registrationDeadline: values.registrationDeadline
      ? new Date(values.registrationDeadline)
      : undefined,
    tags: values.tags,
  };
}
