import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { recordLoginAttempt, resolveLoginIdentifier } from "@/lib/auth/login-activity";
import { loginSchema } from "@/lib/validation/auth.validation";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { rateLimitOrProblem } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await rateLimitOrProblem(request.headers, "login");
  if (limited) return limited;

  // Remembered so the catch block can audit a failed attempt against the
  // account that was actually targeted (request bodies can't be re-read).
  let attemptedIdentifier = "";

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { emailOrUsername, password } = validationResult.data;

    // The field accepts a username too, but signInEmail only understands
    // emails — resolve it first. Without this, username sign-in silently
    // failed for every user.
    const email = await resolveLoginIdentifier(emailOrUsername);
    attemptedIdentifier = email;

    // Process login using Better Auth API
    const result = await auth.api.signInEmail({
      body: {
        email: email,
        password: password,
      },
    });

    await recordLoginAttempt({
      emailOrUsername: email,
      successful: true,
      headers: request.headers,
    });

    return successResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      // A wrong password on a real account is exactly the audit trail the
      // userLoginActivity table exists for. Unknown identifiers record
      // nothing (recordLoginAttempt skips them — no user row to attach).
      if (attemptedIdentifier) {
        await recordLoginAttempt({
          emailOrUsername: attemptedIdentifier,
          successful: false,
          headers: request.headers,
        });
      }

      return problemResponse(
        problem("login-failed", error.statusCode ?? 401, "Login failed", error.message),
      );
    }

    logger.error("Login error", error);
    return problemResponse(problems.internalError("An unexpected error occurred during login"));
  }
}
