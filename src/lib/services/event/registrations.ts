import { RegisterForEventRequest, EventRegistrationResponse } from "@/types/event";
import { API_PREFIX } from "@/lib/api-prefix";
import { type DbRegistrationStatus } from "@/lib/utils/event-utils";
import { ValidationError, BusinessLogicError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { handleApiResponse } from "./helpers";
import { getEventById } from "./queries";
import {
  hydrateWriteEvent,
  hydrateWriteRegistration,
  type ApiEventWriteDto,
  type ApiRegistrationWriteDto,
} from "./types";

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
