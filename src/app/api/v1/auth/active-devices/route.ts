import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";

// GET /api/v1/auth/active-devices - Get user's active devices
export async function GET(request: NextRequest) {
  try {
    // Get active devices using Better Auth API
    const sessions = await auth.api.listSessions({
      headers: request.headers,
    });

    return successResponse({ devices: sessions });
  } catch (error) {
    console.error("List active devices error:", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while retrieving active devices"),
    );
  }
}

// DELETE /api/v1/auth/active-devices - Deactivate a device
export async function DELETE(request: NextRequest) {
  try {
    // Get device ID from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return problemResponse(problems.businessLogicError("Device token is required"));
    }

    // Deactivate device using Better Auth API
    await auth.api.revokeSession({
      body: {
        token: token,
      },
      headers: request.headers,
    });

    return successResponse(null, { message: "Device deactivated successfully" });
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

    console.error("Deactivate device error:", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while deactivating device"),
    );
  }
}
