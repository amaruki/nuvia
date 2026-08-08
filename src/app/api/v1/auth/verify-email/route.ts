import { NextRequest } from "next/server";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { rateLimitOrProblem } from "@/lib/rate-limit";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

/**
 * POST /api/v1/auth/verify-email — verify a user's email address.
 *
 * Replaced the previous placeholder, which returned success without
 * verifying anything: any caller could claim any email was verified.
 * Now delegates to better-auth's real verifyEmail endpoint, which
 * validates the signed token and flips the user's emailVerified flag.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitOrProblem(request.headers, "verifyEmail");
  if (limited) return limited;

  try {
    const body = await request.json();
    const validationResult = verifyEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const result = await auth.api.verifyEmail({
      query: { token: validationResult.data.token },
    });

    // better-auth's typed surface narrows the payload to
    // void | { status: boolean } even though the endpoint answers
    // { status, user }; read the extra member defensively.
    const payload = (result ?? {}) as {
      status?: boolean;
      user?: { id: string; email: string } | null;
    };

    return successResponse(
      {
        status: payload.status ?? true,
        user: payload.user ? { id: payload.user.id, email: payload.user.email } : null,
      },
      { message: "Email verified successfully" },
    );
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem(
          "email-verification-failed",
          error.statusCode ?? 400,
          "Email verification failed",
          error.message,
        ),
      );
    }

    logger.error("Verify email error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while verifying email"),
    );
  }
}
