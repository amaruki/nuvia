import type { ChangeEvent } from "react";

import type { EventStatus, EventType } from "@/types/event";

/** Shape of the controlled edit-event form state. Dates are `datetime-local` strings. */
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

/** Shared handler contract for text/textarea inputs keyed by `name`. */
export type FormInputChangeHandler = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => void;

/** Shared handler contract for checkbox inputs keyed by `name`. */
export type FormCheckboxChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void;

/** Shared handler contract for Radix selects, keyed by form field name. */
export type FormSelectChangeHandler = (name: string, value: string) => void;
