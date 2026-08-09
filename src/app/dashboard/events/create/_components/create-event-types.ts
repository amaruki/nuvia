import type { ChangeEvent } from "react";

import type { EventType } from "@/types/event";

/** Shape of the controlled create-event form state. Dates are `datetime-local` strings. */
export interface CreateEventFormData {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: string;
  virtualEventUrl: string;
  isVirtual: boolean;
  isInPerson: boolean;
  maxAttendees: string;
  registrationDeadline: string;
}

/** Shared handler contract for text/textarea/select inputs keyed by `name`. */
export type FormInputChangeHandler = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => void;

/** Shared handler contract for checkbox inputs keyed by `name`. */
export type FormCheckboxChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void;
