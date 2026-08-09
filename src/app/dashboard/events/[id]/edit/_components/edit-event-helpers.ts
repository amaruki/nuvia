import { Event, EventStatus, EventType, UpdateEventRequest } from "@/types/event";

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

/**
 * Client-side validation for the edit form. The API re-validates with the
 * authoritative zod schema (event-write); this pass gives immediate,
 * field-level feedback before the request leaves the browser.
 */
export function validateEditFormData(formData: EventFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.title.trim()) {
    errors.title = "Title is required";
  } else if (formData.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (!formData.description.trim()) {
    errors.description = "Description is required";
  } else if (formData.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters";
  }

  const startDate = formData.startDate ? new Date(formData.startDate) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    errors.startDate = "Start date is required";
  }

  const endDate = formData.endDate ? new Date(formData.endDate) : null;
  if (!endDate || Number.isNaN(endDate.getTime())) {
    errors.endDate = "End date is required";
  } else if (startDate && !Number.isNaN(startDate.getTime()) && endDate <= startDate) {
    errors.endDate = "End date must be after the start date";
  }

  if (formData.registrationDeadline) {
    const deadline = new Date(formData.registrationDeadline);
    if (Number.isNaN(deadline.getTime())) {
      errors.registrationDeadline = "Registration deadline must be a valid date";
    } else if (startDate && !Number.isNaN(startDate.getTime()) && deadline >= startDate) {
      errors.registrationDeadline = "Registration deadline must be before the start date";
    }
  }

  if (!formData.isVirtual && !formData.isInPerson) {
    errors.format = "Choose at least one of virtual or in-person";
  }

  if (formData.isVirtual && formData.virtualEventUrl.trim()) {
    try {
      new URL(formData.virtualEventUrl.trim());
    } catch {
      errors.virtualEventUrl = "Virtual event URL must be a valid URL";
    }
  }

  if (formData.maxAttendees.trim()) {
    const capacity = Number(formData.maxAttendees);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      errors.maxAttendees = "Capacity must be a positive whole number";
    }
  }

  return errors;
}

/** Maps the flat form state into the event service's update request. */
export function buildUpdateEventRequest(
  formData: EventFormData,
  tags: string[],
): UpdateEventRequest {
  return {
    title: formData.title.trim(),
    description: formData.description,
    shortDescription: formData.shortDescription.trim() || undefined,
    eventType: formData.eventType,
    status: formData.status,
    startDate: new Date(formData.startDate),
    endDate: new Date(formData.endDate),
    location: formData.location.trim(),
    virtualEventUrl: formData.virtualEventUrl.trim() || undefined,
    isVirtual: formData.isVirtual,
    isInPerson: formData.isInPerson,
    maxAttendees: formData.maxAttendees.trim() ? Number(formData.maxAttendees) : undefined,
    registrationDeadline: formData.registrationDeadline
      ? new Date(formData.registrationDeadline)
      : undefined,
    tags,
  };
}
