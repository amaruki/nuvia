import { EventType } from "@/types/event";

import type { CreateEventFormData } from "./create-event-types";

/** Form state for a brand-new event draft. */
export const INITIAL_FORM_DATA: CreateEventFormData = {
  title: "",
  description: "",
  shortDescription: "",
  eventType: EventType.WORKSHOP,
  startDate: "",
  endDate: "",
  location: "",
  virtualEventUrl: "",
  isVirtual: false,
  isInPerson: true,
  maxAttendees: "",
  registrationDeadline: "",
};
