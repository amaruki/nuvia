import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          errors: {
            authentication: ["You must be logged in to access this resource"],
          },
          meta: {
            timestamp: new Date(),
            version: "v1",
          },
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Note: better-auth doesn't have built-in login activities tracking
    // This is a placeholder implementation
    // In a real application, you would implement this functionality separately
    const activities: any[] = [];
    const total = 0;

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      message: "Login activities retrieved successfully",
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: "v1",
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

    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while retrieving login activities",
        errors: {
          server: ["Please try again later"],
        },
        meta: {
          timestamp: new Date(),
          version: "v1",
        },
      },
      { status: 500 },
    );
  }
}
