import { EventCertificate } from "@/types/event.types";
import { API_PREFIX } from "@/lib/api-prefix";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { handleApiResponse } from "./helpers";

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
