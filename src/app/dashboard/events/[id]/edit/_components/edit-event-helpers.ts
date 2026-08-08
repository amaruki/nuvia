import { Event, EventStatus, EventType } from "@/types/event";

import type { EventFormData } from "./edit-event-types";

/** Form state before the fetched event has been mapped in. */
export const INITIAL_FORM_DATA: EventFormData = {
  title: "",
  description: "",
  shortDescription: "",
  eventType: EventType.WORKSHOP,
  status: EventStatus.DRAFT,
  startDate: "",
  endDate: "",
  location: "",
  virtualEventUrl: "",
  isVirtual: false,
  isInPerson: true,
  maxAttendees: "",
  registrationDeadline: "",
};

/** Format a date for a `datetime-local` input field. */
export function formatDateForInput(date: Date): string {
  return new Date(date).toISOString().slice(0, 16);
}

/** Map a fetched event into the editable form state. */
export function mapEventToFormData(eventData: Event): EventFormData {
  return {
    title: eventData.title,
    description: eventData.description,
    shortDescription: eventData.shortDescription || "",
    eventType: eventData.eventType,
    status: eventData.status,
    startDate: formatDateForInput(eventData.startDate),
    endDate: formatDateForInput(eventData.endDate),
    location: eventData.location,
    virtualEventUrl: eventData.virtualEventUrl || "",
    isVirtual: eventData.isVirtual,
    isInPerson: eventData.isInPerson,
    maxAttendees: eventData.maxAttendees?.toString() || "",
    registrationDeadline: eventData.registrationDeadline
      ? formatDateForInput(eventData.registrationDeadline)
      : "",
  };
}
