import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth/utils";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";

// GET /api/v1/auth/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    // Get user profile
    const user = await AuthUtils.getCurrentUser(request);

    if (!user) {
      return problemResponse(problems.authenticationRequired());
    }

    return successResponse({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while retrieving profile"),
    );
  }
}

// PUT /api/v1/auth/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Update user profile using Better Auth API
    const updatedUser = await auth.api.updateUser({
      body: body,
      headers: request.headers,
    });

    return successResponse({ user: updatedUser });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem(
          "profile-update-failed",
          error.statusCode ?? 400,
          "Profile update failed",
          error.message,
        ),
      );
    }

    console.error("Update profile error:", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while updating profile"),
    );
  }
}
