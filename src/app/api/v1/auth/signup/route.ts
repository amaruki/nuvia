import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
// TODO: Fix rate limiter implementation - rate-limiter.ts file is missing
// import { rateLimiters, createRateLimitResponse } from '@/lib/utils/rate-limiter';
import { signupSchema } from "@/lib/validation/auth.validation";
import { fromZodError } from "zod-validation-error";

export async function POST(request: NextRequest) {
  // Initialize headers object to be accessible in both try and catch blocks
  const headers: Record<string, string> = {};

  try {
    // TODO: Re-enable rate limiting once rate-limiter.ts is implemented
    // const rateLimitResult = await rateLimiters.signup(request);

    // Add rate limit headers to response
    // headers['X-RateLimit-Limit'] = rateLimitResult.attempts.toString();
    // headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
    // headers['X-RateLimit-Reset'] = rateLimitResult.resetTime.toISOString();

    // Check if rate limit exceeded
    // TODO: Re-enable once rate-limiters are implemented
    // if (rateLimitResult.isLimited) {
    //   headers['Retry-After'] = Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString();
    //   return createRateLimitResponse(rateLimitResult);
    // }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: {
            validation: validationError.message,
          },
          meta: {
            timestamp: new Date(),
            version: "v1",
          },
        },
        {
          status: 400,
          headers: headers,
        },
      );
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

    // Create a standardized response
    const response = {
      success: true,
      message: "Signup successful",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          username: (result.user as any).username || null,
        },
      },
    };

    return NextResponse.json(response, { headers: headers });
  } catch (error) {
    console.error("Signup error:", error);

    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during signup",
        errors: {
          server: ["Please try again later"],
        },
        meta: {
          timestamp: new Date(),
          version: "v1",
        },
      },
      {
        status: 500,
        headers: headers,
      },
    );
  }
}
