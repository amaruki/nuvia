import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth/utils";
import { profileApiUpdateSchema } from "@/lib/validation/auth.validation";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";

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
    logger.error("Get profile error", error);
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

    // Whitelist the fields before they reach better-auth. The previous
    // version forwarded the raw body, so any key better-auth's updateUser
    // recognizes could be set through this endpoint unvalidated.
    const validationResult = profileApiUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    // Update user profile using Better Auth API
    const updatedUser = await auth.api.updateUser({
      body: validationResult.data,
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

    logger.error("Update profile error", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while updating profile"),
    );
  }
}
