import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Process forgot password using Better Auth API
    // (renamed from forgetPassword -> requestPasswordReset in better-auth 1.5)
    await auth.api.requestPasswordReset({
      body: {
        email: email,
        redirectTo: "/auth/reset-password",
      },
    });

    // Always return success for security (don't reveal if email exists)
    const response = {
      success: true,
      message: "Password reset email sent if account exists",
    };

    return NextResponse.json(response);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during forgot password",
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
