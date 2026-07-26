import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Process change password using Better Auth API
    await auth.api.changePassword({
      body: {
        currentPassword: currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
    });

    // Create a standardized response
    const response = {
      success: true,
      message: "Password changed successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while changing password",
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
