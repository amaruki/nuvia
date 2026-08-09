/**
 * Demo login (UI-39, stage 3) — POST /api/v1/demo/login.
 *
 * The ONLY way into the disposable demo account. Differences from
 * /api/v1/auth/login, all deliberate:
 *
 *   - 404s unless DEMO_MODE=true, so a production instance doesn't even
 *     admit this endpoint exists.
 *   - Role gate BEFORE any password check: the resolved account must carry
 *     the custom "demo" role. Seeded admins, staff, real members — none of
 *     them can authenticate here, no matter the password.
 *   - Its own strict rate-limit bucket (RATE_LIMITS.demoLogin): one shared
 *     credential for every visitor is a brute-force magnet.
 *   - Signs in by forwarding to better-auth's own HTTP handler and copying
 *     the Set-Cookie headers across — auth.api.signInEmail() doesn't expose
 *     cookies, and the session cookie is the only state we want to hand the
 *     browser.
 *
 * The credential itself is rotated by scripts/reset-demo.ts (daily cron) and
 * printed to stdout there — never logged, never stored anywhere else.
 */
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { recordLoginAttempt, resolveLoginIdentifier } from "@/lib/auth/login-activity";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { DEMO_ROLE } from "@/lib/demo";
import { isDemoMode } from "@/lib/env";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { rateLimitOrProblem } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth.validation";

export async function POST(request: NextRequest) {
  if (!isDemoMode()) {
    return problemResponse(
      problem("demo-mode-not-found", 404, "Not found", "This instance is not running demo mode."),
    );
  }

  const limited = await rateLimitOrProblem(request.headers, "demoLogin");
  if (limited) return limited;

  let attemptedEmail = "";

  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }
    const { emailOrUsername, password } = validationResult.data;

    const email = await resolveLoginIdentifier(emailOrUsername);
    attemptedEmail = email ?? emailOrUsername;

    // Role gate first: only the custom "demo" role may use this endpoint.
    // One generic refusal for unknown emails AND wrong-role accounts so the
    // response doesn't reveal which accounts exist.
    const target = email
      ? await db
          .select({ id: user.id, role: user.role })
          .from(user)
          .where(eq(user.email, email))
          .limit(1)
      : [];
    if (target.length === 0 || target[0].role !== DEMO_ROLE) {
      return problemResponse(
        problem(
          "demo-account-unavailable",
          403,
          "Demo account unavailable",
          "This endpoint only signs in the demo account.",
        ),
      );
    }

    // Forward to better-auth's own HTTP handler so the session cookie is
    // minted exactly like a normal login; auth.api.signInEmail() returns no
    // cookies of its own.
    const forwarded = await auth.handler(
      new NextRequest(new URL("/api/auth/sign-in/email", request.url), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
        },
        body: JSON.stringify({ email, password, rememberMe: false }),
      }),
    );

    if (!forwarded.ok) {
      await recordLoginAttempt({
        emailOrUsername: attemptedEmail,
        successful: false,
        headers: request.headers,
      });
      return problemResponse(problem("login-failed", 401, "Login failed", "Invalid credentials."));
    }

    await recordLoginAttempt({
      emailOrUsername: attemptedEmail,
      successful: true,
      headers: request.headers,
    });

    const forwardedBody = (await forwarded.json()) as {
      user: { id: string; email: string; name: string; image?: string | null };
    };
    const response = successResponse({
      user: {
        id: forwardedBody.user.id,
        email: forwardedBody.user.email,
        name: forwardedBody.user.name,
        image: forwardedBody.user.image,
        role: DEMO_ROLE,
      },
    });
    for (const cookie of forwarded.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch (error) {
    logger.error("Demo login error", error);
    return problemResponse(problems.internalError("An unexpected error occurred during login"));
  }
}
