import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Deactivate other devices using Better Auth API
    await auth.api.revokeOtherSessions({
      headers: request.headers,
    });

    return successResponse(null, { message: "Other devices deactivated successfully" });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem(
          "device-deactivation-failed",
          error.statusCode ?? 400,
          "Device deactivation failed",
          error.message,
        ),
      );
    }

    logger.error("Deactivate other devices error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while deactivating other devices"),
    );
  }
}
