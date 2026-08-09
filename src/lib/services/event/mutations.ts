import { Event, CreateEventRequest, UpdateEventRequest } from "@/types/event";
import { API_PREFIX } from "@/lib/api-prefix";
import {
  UI_TO_DB_EVENT_STATUS,
  UI_TO_DB_EVENT_TYPE,
  type DbEventFormat,
} from "@/lib/utils/event-utils";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { handleApiResponse } from "./helpers";
import {
  hydrateWriteEvent,
  type ApiEnvelope,
  type ApiEventCategory,
  type ApiEventWriteDto,
} from "./types";

/** Derives the DB format enum from the UI's isVirtual/isInPerson flags. */
function deriveEventFormat(isVirtual: boolean, isInPerson: boolean): DbEventFormat {
  if (isVirtual && isInPerson) return "HYBRID";
  if (isVirtual) return "VIRTUAL";
  return "IN_PERSON";
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
 * Create an event category (UI-02). Backed by POST /api/v1/events/categories;
 * lets a fresh install with an empty event_categories table create events.
 */
export async function createEventCategory(input: {
  name: string;
  displayName: string;
  description?: string;
}): Promise<ApiEventCategory> {
  try {
    const response = await fetch(`${API_PREFIX}/events/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const envelope = await handleApiResponse<{ data?: ApiEventCategory }>(response);
    if (!envelope.data) {
      throw new Error("Unexpected response shape from create event category");
    }
    return envelope.data;
  } catch (error) {
    logger.error("Error creating event category", error);
    throw error;
  }
}
