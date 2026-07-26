import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { rateLimitOrProblem } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await rateLimitOrProblem(request.headers, "resetPassword");
  if (limited) return limited;

  try {
    // Parse request body
    const body = await request.json();
    const { token, newPassword } = body;

    // Process reset password using Better Auth API
    await auth.api.resetPassword({
      body: {
        token: token,
        newPassword: newPassword,
      },
    });

    return successResponse(null, { message: "Password reset successful" });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem(
          "password-reset-failed",
          error.statusCode ?? 400,
          "Password reset failed",
          error.message,
        ),
      );
    }

    logger.error("Reset password error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred during password reset"),
    );
  }
}
