import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { problemResponse, problems, successResponse } from "@/lib/http";

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
    return successResponse(null, { message: "Password reset email sent if account exists" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred during forgot password"),
    );
  }
}
