import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth.validation";
import { fromZodError } from "zod-validation-error";
import { AuthResponseFactory, AuthErrorType } from "@/lib/auth/common";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return AuthResponseFactory.validationError(validationResult.error);
    }

    const { emailOrUsername, password } = validationResult.data;

    // Process login using Better Auth API
    const result = await auth.api.signInEmail({
      body: {
        email: emailOrUsername,
        password: password,
      },
    });

    // Create a standardized response
    return AuthResponseFactory.success(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          image: result.user.image,
        },
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Login error:", error);

    // Return a generic error response
    return AuthResponseFactory.internalError("An unexpected error occurred during login");
  }
}
