import { NextRequest, NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/errors";

export async function DELETE(request: NextRequest) {
  try {
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

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : undefined;

    // auth.api.deleteUser hard-deletes the user row (cascades to sessions,
    // accounts, active devices, login activity, password reset tokens, and
    // role-change history), revokes every session, and clears the session
    // cookie. Requires either a password or a session created recently
    // enough to count as "fresh" (better-auth's own freshAge check).
    await auth.api.deleteUser({
      headers: request.headers,
      body: password ? { password } : {},
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: "Account deleted successfully",
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: "v1",
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errors: { account: [error.message] },
          meta: {
            timestamp: new Date(),
            version: "v1",
          },
        },
        { status: error.statusCode ?? 400 },
      );
    }

    logError(error as Error, {
      endpoint: "/api/v1/auth/delete-account",
      method: "DELETE",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while deleting account",
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
