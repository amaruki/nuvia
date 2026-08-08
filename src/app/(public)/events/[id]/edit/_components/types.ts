// Shared form types for the public event edit page parts.

import { EventStatus, EventType } from "@/types/event";

/**
 * Flat edit-form state. Dates are `datetime-local` strings and numeric fields
 * are strings so every field can bind directly to its input.
 */
export interface EventFormData {
  title: string;
  description: string;
  shortDescription: string;
  eventType: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  virtualEventUrl: string;
  isVirtual: boolean;
  isInPerson: boolean;
  maxAttendees: string;
  registrationDeadline: string;
}

/** Value/label pair rendered by the event type and status selects. */
export interface EventFormOption {
  value: string;
  label: string;
}

export const initialFormData: EventFormData = {
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
