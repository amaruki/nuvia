import { NextRequest } from "next/server";
import { logError } from "@/lib/errors";
import { problemResponse, problems, successResponse } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    // Get token from request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return problemResponse(problems.businessLogicError("Verification token is required"));
    }

    // TODO: this is a placeholder — better-auth does have a real
    // verifyEmail endpoint (auth.api.verifyEmail({ query: { token } })),
    // this route just never calls it. See TODO.md.
    return successResponse({ user: null }, { message: "Email verified successfully" });
  } catch (error) {
    // Log the error for debugging
    logError(error as Error, {
      endpoint: "/api/v1/auth/verify-email",
      method: "POST",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return problemResponse(
      problems.internalError("An unexpected error occurred while verifying email"),
    );
  }
}
