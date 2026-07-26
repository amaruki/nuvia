import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth.validation";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { emailOrUsername, password } = validationResult.data;

    // Process login using Better Auth API
    const result = await auth.api.signInEmail({
      body: {
        email: emailOrUsername,
        password: password,
      },
    });

    return successResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem("login-failed", error.statusCode ?? 401, "Login failed", error.message),
      );
    }

    console.error("Login error:", error);
    return problemResponse(problems.internalError("An unexpected error occurred during login"));
  }
}
