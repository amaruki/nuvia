import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth/utils";

// GET /api/v1/auth/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    // Get user profile
    const user = await AuthUtils.getCurrentUser(request);

    if (!user) {
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

    return NextResponse.json({
      success: true,
      data: {
        user,
      },
      message: "Profile retrieved successfully",
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: "v1",
      },
    });
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while retrieving profile",
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

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
      },
      message: "Profile updated successfully",
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: "v1",
      },
    });
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while updating profile",
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
