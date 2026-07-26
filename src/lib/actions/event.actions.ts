/**
 * Server actions for event operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthUtils } from "@/lib/auth/utils";
import {
  CreateEventRequest,
  UpdateEventRequest,
  RegisterForEventRequest,
  CheckInToEventRequest,
  Event,
  EventRegistrationResponse,
  EventCheckInResponse,
} from "@/types/event.types";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  checkInToEvent,
} from "@/lib/services/event.service";
import { createSuccessResponse, createErrorResponse, ValidationError } from "@/lib/errors";
import {
  createEventSchema,
  updateEventSchema,
  eventRegistrationSchema,
  eventCheckInSchema,
} from "@/lib/validation/event.validation";
import { z } from "zod";

/**
 * Create a new event
 */
export async function createEventAction(eventData: CreateEventRequest) {
  try {
    // Validate input
    const validatedData = createEventSchema.parse(eventData);

    // Check if user is authenticated
    const user = await AuthUtils.getCurrentUser();
    if (!user) {
      throw new ValidationError([{ field: "auth", message: "Authentication required" }]);
    }

    // Create event
    const event = await createEvent(validatedData);

    // Revalidate events page
    revalidatePath("/events");

    return createSuccessResponse(event, "Event created successfully");
  } catch (error) {
    console.error("Error creating event:", error);

    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return createErrorResponse(new ValidationError(fieldErrors));
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error("Failed to create event"));
  }
}

/**
 * Update an existing event
 */
export async function updateEventAction(eventId: string, eventData: UpdateEventRequest) {
  try {
    // Validate input
    const validatedData = updateEventSchema.parse(eventData);

    // Check if user is authenticated
    const user = await AuthUtils.getCurrentUser();
    if (!user) {
      throw new ValidationError([{ field: "auth", message: "Authentication required" }]);
    }

    // Update event
    const event = await updateEvent(eventId, validatedData);

    // Revalidate paths
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/edit`);

    return createSuccessResponse(event, "Event updated successfully");
  } catch (error) {
    console.error("Error updating event:", error);

    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return createErrorResponse(new ValidationError(fieldErrors));
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error("Failed to update event"));
  }
}

/**
 * Delete an event
 */
export async function deleteEventAction(eventId: string) {
  try {
    // Check if user is authenticated
    const user = await AuthUtils.getCurrentUser();
    if (!user) {
      throw new ValidationError([{ field: "auth", message: "Authentication required" }]);
    }

    // Delete event
    await deleteEvent(eventId);

    // Revalidate paths
    revalidatePath("/events");

    // Redirect to events page
    redirect("/events");
  } catch (error) {
    console.error("Error deleting event:", error);

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error("Failed to delete event"));
  }
}

/**
 * Register for an event
 */
export async function registerForEventAction(registrationData: RegisterForEventRequest) {
  try {
    // Validate input
    const validatedData = eventRegistrationSchema.parse(registrationData);

    // Check if user is authenticated
    const user = await AuthUtils.getCurrentUser();
    if (!user) {
      throw new ValidationError([{ field: "auth", message: "Authentication required" }]);
    }

    // Register for event
    const result = await registerForEvent(validatedData);

    // Revalidate paths
    revalidatePath("/events");
    revalidatePath(`/events/${registrationData.eventId}`);

    return createSuccessResponse(result.data, result.message);
  } catch (error) {
    console.error("Error registering for event:", error);

    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return createErrorResponse(new ValidationError(fieldErrors));
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error("Failed to register for event"));
  }
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistrationAction(eventId: string) {
  try {
    // Check if user is authenticated
    const user = await AuthUtils.getCurrentUser();
    if (!user) {
      throw new ValidationError([{ field: "auth", message: "Authentication required" }]);
    }

    // Cancel registration
    const result = await cancelEventRegistration(eventId);

    // Revalidate paths
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return createSuccessResponse(result.data, result.message);
  } catch (error) {
    console.error("Error cancelling event registration:", error);

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error("Failed to cancel event registration"));
  }
}

/**
 * Check in to an event
 */
export async function checkInToEventAction(checkInData: CheckInToEventRequest) {
  try {
    // Validate input
    const validatedData = eventCheckInSchema.parse(checkInData);

    // Check if user is authenticated
    const user = await AuthUtils.getCurrentUser();
    if (!user) {
      throw new ValidationError([{ field: "auth", message: "Authentication required" }]);
    }

    // Check in to event
    const result = await checkInToEvent(validatedData);

    // Revalidate paths
    revalidatePath("/events");
    revalidatePath(`/events/${checkInData.eventId}`);
    revalidatePath(`/events/${checkInData.eventId}/check-in`);

    return createSuccessResponse(result.data, result.message);
  } catch (error) {
    console.error("Error checking in to event:", error);

    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return createErrorResponse(new ValidationError(fieldErrors));
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(new Error("Failed to check in to event"));
  }
}
