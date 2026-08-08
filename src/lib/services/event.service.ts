/**
 * Event service for handling event-related API operations
 */

import {
  Event,
  EventRegistration,
  EventCertificate,
  EventFilter,
  CreateEventRequest,
  UpdateEventRequest,
  RegisterForEventRequest,
  CheckInToEventRequest,
  EventListResponse,
  EventDetailsResponse,
  EventRegistrationResponse,
  EventCheckInResponse,
  EventStatistics,
  EventDashboardData,
  EventStatus,
} from "@/types/event.types";
import { API_PREFIX } from "@/lib/api-prefix";
import {
  UI_TO_DB_EVENT_STATUS,
  UI_TO_DB_EVENT_TYPE,
  IN_PERSON_EVENT_FORMATS,
  REMOTE_EVENT_FORMATS,
  DB_TO_UI_EVENT_STATUS,
  DB_TO_UI_EVENT_TYPE,
  DB_TO_UI_REGISTRATION_STATUS,
  type DbEventFormat,
  type DbEventStatus,
  type DbEventType,
  type DbRegistrationStatus,
} from "@/lib/utils/event-utils";
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  BusinessLogicError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Helper function to handle API responses
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      // RFC 9457 problems carry `detail`; legacy payloads used `message`.
      errorMessage = errorData.detail || errorData.message || errorMessage;

      // Map HTTP status codes to custom error types
      if (response.status === 400) {
        throw new ValidationError(normalizeFieldErrors(errorData.errors, errorMessage));
      } else if (response.status === 401) {
        throw new AuthorizationError("Unauthorized access");
      } else if (response.status === 403) {
        throw new AuthorizationError(errorData.detail || "Insufficient permissions");
      } else if (response.status === 404) {
        throw new NotFoundError("Resource", "unknown");
      } else if (response.status === 409) {
        throw new BusinessLogicError(errorMessage, "CONFLICT");
      } else if (response.status === 422) {
        throw new ValidationError(normalizeFieldErrors(errorData.errors, errorMessage));
      }
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof AuthorizationError ||
        error instanceof BusinessLogicError
      ) {
        throw error;
      }
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Accepts both RFC 9457 validation payloads (`errors: [{ field, message }]`)
 * and the legacy record shape (`errors: { field: [messages] }`) and returns
 * the flat field-error list the UI error classes consume.
 */
function normalizeFieldErrors(
  rawErrors: unknown,
  fallbackMessage: string,
): Array<{ field: string; message: string }> {
  if (Array.isArray(rawErrors)) {
    const fields = rawErrors
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        field: String((entry as { field?: unknown }).field ?? "general"),
        message: String((entry as { message?: unknown }).message ?? fallbackMessage),
      }));
    if (fields.length > 0) return fields;
  } else if (rawErrors && typeof rawErrors === "object") {
    return Object.entries(rawErrors as Record<string, string[]>).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message: String(message) })),
    );
  }
  return [{ field: "general", message: fallbackMessage }];
}

// ---------------------------------------------------------------------------
// Read-path payload types (backlog B2)
//
// The API serializes Dates as ISO strings; the UI Event/EventRegistration
// types use Date objects. The Api* types describe the wire shape and the
// hydrate helpers convert it into the UI shape.
// ---------------------------------------------------------------------------

type ApiEvent = Omit<
  Event,
  "startDate" | "endDate" | "createdAt" | "updatedAt" | "registrationDeadline" | "organizer"
> & {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  registrationDeadline?: string;
};

type ApiEventRegistration = Omit<
  EventRegistration,
  "registeredAt" | "checkedInAt" | "createdAt" | "updatedAt" | "user"
> & {
  registeredAt: string;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
};

interface ApiEventDetail {
  event: ApiEvent;
  isRegistered: boolean;
  registration?: ApiEventRegistration;
  organizerEvents: ApiEvent[];
  similarEvents: ApiEvent[];
}

interface ApiPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface ApiEnvelope<T> {
  data?: T;
  meta?: ApiPaginationMeta;
}

function hydrateEvent(payload: ApiEvent): Event {
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

function hydrateRegistration(payload: ApiEventRegistration): EventRegistration {
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

interface ApiEventWriteDto {
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

interface ApiRegistrationWriteDto {
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

function hydrateWriteEvent(payload: ApiEventWriteDto): Event {
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

function hydrateWriteRegistration(payload: ApiRegistrationWriteDto): EventRegistration {
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

/** Derives the DB format enum from the UI's isVirtual/isInPerson flags. */
function deriveEventFormat(isVirtual: boolean, isInPerson: boolean): DbEventFormat {
  if (isVirtual && isInPerson) return "HYBRID";
  if (isVirtual) return "VIRTUAL";
  return "IN_PERSON";
}

/**
 * Translates the UI EventFilter into GET /api/v1/events query parameters.
 * The API speaks the schema vocabulary (uppercase DB enums, `format` instead
 * of `isInPerson`), so UI values are expanded through the mapping tables in
 * event-utils.
 */
function buildEventsQuery(filter: EventFilter | undefined, page: number, pageSize: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(pageSize));

  if (filter) {
    if (filter.searchQuery) params.set("search", filter.searchQuery);
    for (const status of filter.status ?? []) {
      for (const dbStatus of UI_TO_DB_EVENT_STATUS[status]) params.append("status", dbStatus);
    }
    for (const eventType of filter.eventType ?? []) {
      for (const dbType of UI_TO_DB_EVENT_TYPE[eventType]) params.append("type", dbType);
    }
    if (filter.startDate) params.set("startDate", filter.startDate.toISOString());
    if (filter.endDate) params.set("endDate", filter.endDate.toISOString());
    if (filter.organizerId) params.set("createdBy", filter.organizerId);
    if (filter.isVirtual !== undefined) params.set("isVirtual", String(filter.isVirtual));
    const formats =
      filter.isInPerson === true
        ? IN_PERSON_EVENT_FORMATS
        : filter.isInPerson === false
          ? REMOTE_EVENT_FORMATS
          : [];
    for (const format of formats) params.append("format", format);
    for (const tag of filter.tags ?? []) params.append("tags", tag);
  }

  return params.toString();
}

/**
 * Get all events with optional filtering and pagination
 */
export async function getEvents(
  filter?: EventFilter,
  page = 1,
  pageSize = 10,
): Promise<EventListResponse> {
  try {
    const query = buildEventsQuery(filter, page, pageSize);
    const response = await fetch(`${API_PREFIX}/events?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const envelope = await handleApiResponse<ApiEnvelope<{ events: ApiEvent[] }>>(response);
    const meta = envelope.meta ?? {};

    return {
      events: (envelope.data?.events ?? []).map(hydrateEvent),
      totalCount: meta.total ?? 0,
      page: meta.page ?? page,
      pageSize: meta.limit ?? pageSize,
      totalPages: meta.totalPages ?? 0,
    };
  } catch (error) {
    logger.error("Error fetching events", error);
    throw error;
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<EventDetailsResponse> {
  if (!id) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${API_PREFIX}/events/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const envelope = await handleApiResponse<ApiEnvelope<ApiEventDetail>>(response);
    const detail = envelope.data;

    if (!detail?.event) {
      throw new NotFoundError("Event", id);
    }

    return {
      event: hydrateEvent(detail.event),
      isRegistered: detail.isRegistered ?? false,
      registration: detail.registration ? hydrateRegistration(detail.registration) : undefined,
      organizerEvents: (detail.organizerEvents ?? []).map(hydrateEvent),
      similarEvents: (detail.similarEvents ?? []).map(hydrateEvent),
    };
  } catch (error) {
    logger.error(`Error fetching event with ID ${id}`, error);
    throw error;
  }
}

/**
 * Create a new event (backlog B3 write path)
 */
export async function createEvent(eventData: CreateEventRequest): Promise<Event> {
  try {
    const response = await fetch(`${API_PREFIX}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: eventData.title,
        description: eventData.description,
        shortDescription: eventData.shortDescription,
        category: eventData.category ?? "general",
        type: UI_TO_DB_EVENT_TYPE[eventData.eventType][0],
        format: deriveEventFormat(eventData.isVirtual, eventData.isInPerson),
        capacity: eventData.maxAttendees,
        isVirtual: eventData.isVirtual,
        location: eventData.location,
        virtualUrl: eventData.virtualEventUrl,
        startTime: eventData.startDate.toISOString(),
        endTime: eventData.endDate.toISOString(),
        registrationEnd: eventData.registrationDeadline?.toISOString(),
        tags: eventData.tags ?? [],
      }),
    });

    const envelope = await handleApiResponse<ApiEnvelope<ApiEventWriteDto>>(response);
    if (!envelope.data) {
      throw new Error("Unexpected response shape from create event");
    }
    return hydrateWriteEvent(envelope.data);
  } catch (error) {
    logger.error("Error creating event", error);
    throw error;
  }
}

/**
 * Update an existing event (backlog B3 write path — PATCH semantics)
 */
export async function updateEvent(id: string, eventData: UpdateEventRequest): Promise<Event> {
  if (!id) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const body: Record<string, unknown> = {};
    if (eventData.title !== undefined) body.title = eventData.title;
    if (eventData.description !== undefined) body.description = eventData.description;
    if (eventData.shortDescription !== undefined)
      body.shortDescription = eventData.shortDescription;
    if (eventData.category !== undefined) body.category = eventData.category;
    if (eventData.eventType !== undefined) {
      body.type = UI_TO_DB_EVENT_TYPE[eventData.eventType][0];
    }
    if (eventData.isVirtual !== undefined && eventData.isInPerson !== undefined) {
      body.format = deriveEventFormat(eventData.isVirtual, eventData.isInPerson);
    }
    if (eventData.isVirtual !== undefined) body.isVirtual = eventData.isVirtual;
    if (eventData.maxAttendees !== undefined) body.capacity = eventData.maxAttendees;
    if (eventData.location !== undefined) body.location = eventData.location;
    if (eventData.virtualEventUrl !== undefined) body.virtualUrl = eventData.virtualEventUrl;
    if (eventData.startDate !== undefined) body.startTime = eventData.startDate.toISOString();
    if (eventData.endDate !== undefined) body.endTime = eventData.endDate.toISOString();
    if (eventData.registrationDeadline !== undefined) {
      body.registrationEnd = eventData.registrationDeadline.toISOString();
    }
    if (eventData.status !== undefined) {
      body.status = UI_TO_DB_EVENT_STATUS[eventData.status][0];
    }
    if (eventData.tags !== undefined) body.tags = eventData.tags;

    const response = await fetch(`${API_PREFIX}/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const envelope = await handleApiResponse<ApiEnvelope<ApiEventWriteDto>>(response);
    if (!envelope.data) {
      throw new Error("Unexpected response shape from update event");
    }
    return hydrateWriteEvent(envelope.data);
  } catch (error) {
    logger.error(`Error updating event with ID ${id}`, error);
    throw error;
  }
}

/**
 * Delete an event (backlog B3 write path)
 */
export async function deleteEvent(id: string): Promise<void> {
  if (!id) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${API_PREFIX}/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    await handleApiResponse<{ data: { id: string; deleted: boolean } }>(response);
  } catch (error) {
    logger.error(`Error deleting event with ID ${id}`, error);
    throw error;
  }
}

/**
 * Register for an event (backlog B3: POST /events/[id]/registrations).
 * The user id comes from the session server-side; only notes travel in the
 * body. Paid events surface a 501 problem until payments land.
 */
export async function registerForEvent(
  registrationData: RegisterForEventRequest,
): Promise<EventRegistrationResponse> {
  if (!registrationData.eventId) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(
      `${API_PREFIX}/events/${encodeURIComponent(registrationData.eventId)}/registrations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: registrationData.notes }),
      },
    );

    const envelope = await handleApiResponse<{
      data: ApiRegistrationWriteDto;
      meta?: { event?: ApiEventWriteDto };
    }>(response);

    const registration = hydrateWriteRegistration(envelope.data);
    const event = envelope.meta?.event
      ? hydrateWriteEvent(envelope.meta.event)
      : (await getEventById(registrationData.eventId)).event;

    const statusMessages: Record<DbRegistrationStatus, string> = {
      CONFIRMED: "Your registration is confirmed",
      PENDING: "Your registration is pending organizer approval",
      WAITLISTED: "This event is full — you have been added to the waitlist",
      CANCELED: "Registration canceled",
      ATTENDED: "Your registration is confirmed",
      NO_SHOW: "Your registration is confirmed",
    };

    return {
      success: true,
      message: statusMessages[envelope.data.status],
      data: { registration, event },
    };
  } catch (error) {
    logger.error("Error registering for event", error);
    throw error;
  }
}

/**
 * Cancel event registration (backlog B3). Finds the caller's registration
 * through the event detail endpoint, then POSTs to the cancel route.
 */
export async function cancelEventRegistration(eventId: string): Promise<EventRegistrationResponse> {
  if (!eventId) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const detail = await getEventById(eventId);
    const registrationId = detail.registration?.id;
    if (!registrationId) {
      throw new BusinessLogicError("You are not registered for this event", "NOT_REGISTERED");
    }

    const response = await fetch(
      `${API_PREFIX}/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const envelope = await handleApiResponse<{
      data: { registration: ApiRegistrationWriteDto; promoted: ApiRegistrationWriteDto | null };
    }>(response);

    return {
      success: true,
      message: "Your registration has been canceled",
      data: {
        registration: hydrateWriteRegistration(envelope.data.registration),
        event: detail.event,
      },
    };
  } catch (error) {
    logger.error(`Error cancelling registration for event ${eventId}`, error);
    throw error;
  }
}

/**
 * Check in to an event
 */
export async function checkInToEvent(
  checkInData: CheckInToEventRequest,
): Promise<EventCheckInResponse> {
  if (!checkInData.eventId) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${API_PREFIX}/events/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkInData),
    });

    return await handleApiResponse<EventCheckInResponse>(response);
  } catch (error) {
    logger.error("Error checking in to event", error);
    throw error;
  }
}

/**
 * Get event statistics
 */
export async function getEventStatistics(): Promise<EventStatistics> {
  try {
    const response = await fetch(`${API_PREFIX}/events/statistics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return await handleApiResponse<EventStatistics>(response);
  } catch (error) {
    logger.error("Error fetching event statistics", error);
    throw error;
  }
}

/**
 * Get event dashboard data (backlog F2 mock-residue sweep).
 *
 * Upcoming events come from the real B2 read API. Statistics, organized
 * events and registrations are honest empty states: there is no
 * `/api/v1/events/statistics` route (B2/B3 landed per-event reads and
 * admin-only registration listings only) and no API that lists the calling
 * user's registrations across events, so those widgets show zeros/empties
 * instead of invented numbers.
 */
export async function getEventDashboardData(): Promise<EventDashboardData> {
  try {
    const upcoming = await getEvents(
      { status: [EventStatus.PUBLISHED], startDate: new Date() },
      1,
      6,
    );

    return {
      upcomingEvents: upcoming.events,
      myEvents: [],
      myRegistrations: [],
      eventStatistics: {
        totalEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        totalRegistrations: 0,
        averageAttendanceRate: 0,
        popularEventTypes: [],
        monthlyStats: [],
      },
    };
  } catch (error) {
    logger.error("Error fetching event dashboard data", error);
    throw error;
  }
}

/**
 * Get user's event registrations.
 *
 * Honest empty state (backlog F2): B3 landed the per-event registration
 * lifecycle, but there is no API that lists a user's registrations across
 * events (`GET /events/[id]/registrations` is admin-only, `events:manage`)
 * and certificates are not modeled yet. Callers render their empty states
 * until such an endpoint exists.
 */
export async function getUserEventRegistrations(
  userId: string,
  _status?: string[],
): Promise<EventRegistration[]> {
  if (!userId) {
    throw new ValidationError([{ field: "userId", message: "User ID is required" }]);
  }
  return [];
}

/**
 * Get events organized by a user
 */
export async function getUserOrganizedEvents(userId: string): Promise<Event[]> {
  if (!userId) {
    throw new ValidationError([{ field: "userId", message: "User ID is required" }]);
  }

  try {
    const response = await fetch(`${API_PREFIX}/users/${userId}/organized-events`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return await handleApiResponse<Event[]>(response);
  } catch (error) {
    logger.error(`Error fetching organized events for user ${userId}`, error);
    throw error;
  }
}

/**
 * Get event certificate
 */
export async function getEventCertificate(
  eventId: string,
  userId: string,
): Promise<EventCertificate> {
  if (!eventId || !userId) {
    const errors: Array<{ field: string; message: string }> = [];
    if (!eventId) errors.push({ field: "eventId", message: "Event ID is required" });
    if (!userId) errors.push({ field: "userId", message: "User ID is required" });
    throw new ValidationError(errors);
  }

  try {
    const response = await fetch(`${API_PREFIX}/events/${eventId}/certificate/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return await handleApiResponse<EventCertificate>(response);
  } catch (error) {
    logger.error(`Error fetching certificate for event ${eventId} and user ${userId}`, error);
    throw error;
  }
}

/**
 * Verify event certificate
 */
export async function verifyEventCertificate(verificationCode: string): Promise<EventCertificate> {
  if (!verificationCode) {
    throw new ValidationError([
      { field: "verificationCode", message: "Verification code is required" },
    ]);
  }

  try {
    const response = await fetch(`${API_PREFIX}/certificates/verify/${verificationCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return await handleApiResponse<EventCertificate>(response);
  } catch (error) {
    logger.error(`Error verifying certificate with code ${verificationCode}`, error);
    throw error;
  }
}
