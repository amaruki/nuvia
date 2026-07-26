import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { signupSchema } from "@/lib/validation/auth.validation";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { rateLimitOrProblem } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await rateLimitOrProblem(request.headers, "signup");
  if (limited) return limited;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { username, email, password, fullName } = validationResult.data;

    // Process signup using Better Auth API
    const result = await auth.api.signUpEmail({
      body: {
        email: email,
        password: password,
        name: fullName || username,
        username: username,
      },
    });

    return successResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        username: (result.user as any).username || null,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem("signup-failed", error.statusCode ?? 400, "Signup failed", error.message),
      );
    }

    console.error("Signup error:", error);
    return problemResponse(problems.internalError("An unexpected error occurred during signup"));
  }
}
