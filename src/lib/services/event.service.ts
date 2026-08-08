/**
 * Event service for handling event-related API operations
 */

import {
  Event,
  EventRegistration,
  EventCertificate,
  EventCheckIn,
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
} from "@/types/event.types";
import { env } from "@/lib/env";
import {
  getMockEvents,
  getMockEventById,
  getMockUserEventRegistrations,
  getMockEventDashboardData,
} from "@/lib/mock/eventMockData";
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
      errorMessage = errorData.message || errorMessage;

      // Map HTTP status codes to custom error types
      if (response.status === 400) {
        const errors = errorData.errors || { general: [errorMessage] };
        const fieldErrors = Object.entries(errors).flatMap(([field, messages]) =>
          (messages as string[]).map((message) => ({ field, message })),
        );
        throw new ValidationError(fieldErrors);
      } else if (response.status === 401) {
        throw new AuthorizationError("Unauthorized access");
      } else if (response.status === 403) {
        throw new AuthorizationError("Insufficient permissions");
      } else if (response.status === 404) {
        throw new NotFoundError("Resource", "unknown");
      } else if (response.status === 409) {
        throw new BusinessLogicError(errorMessage, "CONFLICT");
      } else if (response.status === 422) {
        const errors = errorData.errors || { general: [errorMessage] };
        const fieldErrors = Object.entries(errors).flatMap(([field, messages]) =>
          (messages as string[]).map((message) => ({ field, message })),
        );
        throw new ValidationError(fieldErrors);
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
 * Get all events with optional filtering and pagination
 */
export async function getEvents(
  filter?: EventFilter,
  page = 1,
  pageSize = 10,
): Promise<EventListResponse> {
  try {
    // Using mock data for demonstration
    return getMockEvents(filter, page, pageSize);
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
    // Using mock data for demonstration
    return getMockEventById(id);
  } catch (error) {
    logger.error(`Error fetching event with ID ${id}`, error);
    throw error;
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: CreateEventRequest): Promise<Event> {
  try {
    const response = await fetch(`${env.API_PREFIX}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    return await handleApiResponse<Event>(response);
  } catch (error) {
    logger.error("Error creating event", error);
    throw error;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, eventData: UpdateEventRequest): Promise<Event> {
  if (!id) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${env.API_PREFIX}/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    return await handleApiResponse<Event>(response);
  } catch (error) {
    logger.error(`Error updating event with ID ${id}`, error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  if (!id) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${env.API_PREFIX}/events/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse<void>(response);
  } catch (error) {
    logger.error(`Error deleting event with ID ${id}`, error);
    throw error;
  }
}

/**
 * Register for an event
 */
export async function registerForEvent(
  registrationData: RegisterForEventRequest,
): Promise<EventRegistrationResponse> {
  if (!registrationData.eventId) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${env.API_PREFIX}/events/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    });

    return await handleApiResponse<EventRegistrationResponse>(response);
  } catch (error) {
    logger.error("Error registering for event", error);
    throw error;
  }
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string): Promise<EventRegistrationResponse> {
  if (!eventId) {
    throw new ValidationError([{ field: "eventId", message: "Event ID is required" }]);
  }

  try {
    const response = await fetch(`${env.API_PREFIX}/events/${eventId}/cancel-registration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await handleApiResponse<EventRegistrationResponse>(response);
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
    const response = await fetch(`${env.API_PREFIX}/events/check-in`, {
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
    const response = await fetch(`${env.API_PREFIX}/events/statistics`, {
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
 * Get event dashboard data
 */
export async function getEventDashboardData(): Promise<EventDashboardData> {
  try {
    // Using mock data for demonstration
    return getMockEventDashboardData();
  } catch (error) {
    logger.error("Error fetching event dashboard data", error);
    throw error;
  }
}

/**
 * Get user's event registrations
 */
export async function getUserEventRegistrations(
  userId: string,
  status?: string[],
): Promise<EventRegistration[]> {
  if (!userId) {
    throw new ValidationError([{ field: "userId", message: "User ID is required" }]);
  }

  try {
    // Using mock data for demonstration
    return getMockUserEventRegistrations(userId, status as any);
  } catch (error) {
    logger.error(`Error fetching event registrations for user ${userId}`, error);
    throw error;
  }
}

/**
 * Get events organized by a user
 */
export async function getUserOrganizedEvents(userId: string): Promise<Event[]> {
  if (!userId) {
    throw new ValidationError([{ field: "userId", message: "User ID is required" }]);
  }

  try {
    const response = await fetch(`${env.API_PREFIX}/users/${userId}/organized-events`, {
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
    const response = await fetch(`${env.API_PREFIX}/events/${eventId}/certificate/${userId}`, {
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
    const response = await fetch(`${env.API_PREFIX}/certificates/verify/${verificationCode}`, {
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
