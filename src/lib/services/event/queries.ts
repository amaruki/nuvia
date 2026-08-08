import {
  Event,
  EventRegistration,
  EventFilter,
  EventListResponse,
  EventDetailsResponse,
  EventStatistics,
  EventDashboardData,
  EventStatus,
} from "@/types/event";
import { API_PREFIX } from "@/lib/api-prefix";
import {
  UI_TO_DB_EVENT_STATUS,
  UI_TO_DB_EVENT_TYPE,
  IN_PERSON_EVENT_FORMATS,
  REMOTE_EVENT_FORMATS,
} from "@/lib/utils/event-utils";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { handleApiResponse } from "./helpers";
import {
  hydrateEvent,
  hydrateRegistration,
  type ApiEnvelope,
  type ApiEvent,
  type ApiEventDetail,
} from "./types";

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
