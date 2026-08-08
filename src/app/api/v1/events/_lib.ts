/**
 * Shared helpers for the /api/v1/events route handlers.
 */

import type { NextResponse } from "next/server";
import { problemResponse, problems } from "@/lib/http";
import { logger } from "@/lib/logger";
import { EventWriteError } from "@/lib/services/event-write";
import { RegistrationServiceError } from "@/lib/services/registration.service";

/** Maps service errors to RFC 9457 responses; anything else is a 500. */
export async function handleEventRoute(
  handler: () => Promise<NextResponse>,
  context: string,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof EventWriteError || error instanceof RegistrationServiceError) {
      return problemResponse(error.problemDetails);
    }
    logger.error(`Unhandled error in ${context}`, error);
    return problemResponse(problems.internalError());
  }
}
