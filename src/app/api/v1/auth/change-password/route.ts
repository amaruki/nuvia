import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { rateLimitOrProblem } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await rateLimitOrProblem(request.headers, "changePassword");
  if (limited) return limited;

  try {
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Process change password using Better Auth API
    await auth.api.changePassword({
      body: {
        currentPassword: currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
    });

    return successResponse(null, { message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem(
          "password-change-failed",
          error.statusCode ?? 400,
          "Password change failed",
          error.message,
        ),
      );
    }

    logger.error("Change password error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while changing password"),
    );
  }
}
