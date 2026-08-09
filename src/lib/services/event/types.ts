import { Event, EventRegistration } from "@/types/event";
import {
  DB_TO_UI_EVENT_STATUS,
  DB_TO_UI_EVENT_TYPE,
  DB_TO_UI_REGISTRATION_STATUS,
  type DbEventFormat,
  type DbEventStatus,
  type DbEventType,
  type DbRegistrationStatus,
} from "@/lib/utils/event-utils";

// ---------------------------------------------------------------------------
// Read-path payload types (backlog B2)
//
// The API serializes Dates as ISO strings; the UI Event/EventRegistration
// types use Date objects. The Api* types describe the wire shape and the
// hydrate helpers convert it into the UI shape.
// ---------------------------------------------------------------------------

export type ApiEvent = Omit<
  Event,
  "startDate" | "endDate" | "createdAt" | "updatedAt" | "registrationDeadline" | "organizer"
> & {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  registrationDeadline?: string;
};

export type ApiEventRegistration = Omit<
  EventRegistration,
  "registeredAt" | "checkedInAt" | "createdAt" | "updatedAt" | "user"
> & {
  registeredAt: string;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
};

export interface ApiEventDetail {
  event: ApiEvent;
  isRegistered: boolean;
  registration?: ApiEventRegistration;
  organizerEvents: ApiEvent[];
  similarEvents: ApiEvent[];
}

export interface ApiPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiEnvelope<T> {
  data?: T;
  meta?: ApiPaginationMeta;
}

/** Wire shape of GET/POST /api/v1/events/categories rows. */
export interface ApiEventCategory {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function hydrateEvent(payload: ApiEvent): Event {
  return {
    ...payload,
    startDate: new Date(payload.startDate),
    endDate: new Date(payload.endDate),
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    registrationDeadline: payload.registrationDeadline
      ? new Date(payload.registrationDeadline)
      : undefined,
  };
}

export function hydrateRegistration(payload: ApiEventRegistration): EventRegistration {
  return {
    ...payload,
    registeredAt: new Date(payload.registeredAt),
    checkedInAt: payload.checkedInAt ? new Date(payload.checkedInAt) : undefined,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Write-path payload types (backlog B3)
//
// The write endpoints (POST/PATCH/DELETE events, registrations) return the
// storage shape: uppercase DB enums, camelCase storage columns, ISO dates.
// The hydrate helpers below translate that shape into the UI types.
// ---------------------------------------------------------------------------

export interface ApiEventWriteDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  type: DbEventType;
  format: DbEventFormat;
  status: DbEventStatus;
  visibility: string;
  capacity: number | null;
  registeredCount: number;
  waitlistCount: number;
  isVirtual: boolean;
  isFree: boolean;
  price: string | null;
  currency: string;
  location: string | null;
  virtualUrl: string | null;
  timezone: string;
  startTime: string;
  endTime: string;
  registrationStart: string | null;
  registrationEnd: string | null;
  allowWaitlist: boolean;
  requiresApproval: boolean;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRegistrationWriteDto {
  id: string;
  eventId: string;
  userId: string;
  status: DbRegistrationStatus;
  registeredAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function hydrateWriteEvent(payload: ApiEventWriteDto): Event {
  return {
    id: payload.id,
    title: payload.title,
    description: payload.description ?? "",
    shortDescription: payload.shortDescription ?? undefined,
    eventType: DB_TO_UI_EVENT_TYPE[payload.type],
    status: DB_TO_UI_EVENT_STATUS[payload.status],
    startDate: new Date(payload.startTime),
    endDate: new Date(payload.endTime),
    location: payload.location ?? "",
    virtualEventUrl: payload.virtualUrl ?? undefined,
    isVirtual: payload.isVirtual,
    isInPerson: payload.format === "IN_PERSON" || payload.format === "HYBRID",
    maxAttendees: payload.capacity ?? undefined,
    currentAttendees: payload.registeredCount,
    registrationDeadline: payload.registrationEnd ? new Date(payload.registrationEnd) : undefined,
    organizerId: payload.createdBy,
    tags: payload.tags,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  };
}

export function hydrateWriteRegistration(payload: ApiRegistrationWriteDto): EventRegistration {
  return {
    id: payload.id,
    eventId: payload.eventId,
    userId: payload.userId,
    status: DB_TO_UI_REGISTRATION_STATUS[payload.status],
    registeredAt: new Date(payload.registeredAt),
    checkedInAt: payload.checkedInAt ? new Date(payload.checkedInAt) : undefined,
    certificateIssued: false,
    notes: payload.notes ?? undefined,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  };
}
