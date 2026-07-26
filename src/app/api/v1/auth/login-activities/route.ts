import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/errors";
import { problemResponse, problems, successResponse } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return problemResponse(problems.authenticationRequired());
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // TODO: this is a placeholder — src/db/schema/users.ts's
    // userLoginActivity table already exists for exactly this, this route
    // just never queries it. See TODO.md.
    const activities: any[] = [];
    const total = 0;

    return successResponse({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // Log the error for debugging
    logError(error as Error, {
      endpoint: "/api/v1/auth/login-activities",
      method: "GET",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return problemResponse(
      problems.internalError("An unexpected error occurred while retrieving login activities"),
    );
  }
}
