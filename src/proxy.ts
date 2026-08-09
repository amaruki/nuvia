/**
 * Consolidated Next.js middleware
 *
 * This middleware uses our refactored auth and rate limiting modules to provide
 * consistent security and rate limiting across the application.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAuthMiddleware } from "@/lib/auth/middleware";

import { AuthResponseFactory } from "@/lib/auth/common";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { logger } from "@/lib/logger";

// TODO: Add support for API key authentication for external services
// TODO: Add support for request logging and analytics
// TODO: Add support for CORS configuration

/**
 * Create middleware with authentication and rate limiting
 */
const authMiddleware = createAuthMiddleware({
  rateLimit: "api",
  skipPaths: ["/api/auth/callback"], // Skip auth for OAuth callbacks
});

/**
 * Main middleware function
 */
export async function proxy(request: NextRequest) {
  try {
    // Protect dashboard routes - require authentication and, per section,
    // the role navigation-data.ts says that section is for (previously
    // only the sidebar enforced this, client-side — see TODO.md M1's
    // "Authorize by role, not just by login").
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const authResult = await authenticate(request);
      if (!authResult.success) {
        // Redirect to login page with return URL
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!isRoleAllowedForPath(request.nextUrl.pathname, authResult.user?.role)) {
        const forbiddenUrl = new URL("/dashboard", request.url);
        forbiddenUrl.searchParams.set("error", "forbidden");
        return NextResponse.redirect(forbiddenUrl);
      }

      // Continue to dashboard page if authenticated and authorized
      return NextResponse.next();
    }

    // Apply authentication middleware to API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
      // Skip auth middleware for OAuth callbacks and public endpoints
      if (isPublicEndpoint(request.nextUrl.pathname)) {
        return NextResponse.next();
      }

      const result = await authMiddleware(request);
      if (result) {
        return result; // Return error response if auth/rate limit fails
      }
    }

    // Continue to the route handler
    return NextResponse.next();
  } catch (error) {
    logger.error("Middleware error", error);
    return AuthResponseFactory.internalError("Internal server error");
  }
}

/**
 * Simple authentication check for middleware
 */
async function authenticate(request: NextRequest): Promise<{ success: boolean; user?: any }> {
  try {
    // Import auth utilities dynamically to avoid server-side issues
    const { AuthUtils } = await import("@/lib/auth/utils");
    const user = await AuthUtils.getCurrentUser(request);

    if (!user) {
      return { success: false };
    }

    return { success: true, user };
  } catch (error) {
    logger.error("Authentication error", error);
    return { success: false };
  }
}

/**
 * Check if the endpoint is public and doesn't require authentication
 */
function isPublicEndpoint(pathname: string): boolean {
  const publicEndpoints = [
    // better-auth's own base path handles its own authentication per
    // endpoint (sign-in, sign-up, session, OAuth). Gating it behind the
    // proxy's session check blocked anonymous flows — sign-in, sign-up,
    // OAuth — for any client calling the HTTP API directly. The custom
    // cache-* routes under this prefix do their own session checks.
    "/api/auth/",
    // Anonymous-by-design v1 auth endpoints.
    "/api/v1/auth/login",
    "/api/v1/auth/signup",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",
    // Stripe provider callback: authenticates by Stripe-Signature (HMAC
    // against STRIPE_WEBHOOK_SECRET) inside the route handler, not by
    // session — ADR-0015 §4. Gating it here 401'd every callback before
    // verification could run (UI-41). Exact path only: no wildcard over
    // /api/v1/webhooks.
    "/api/v1/webhooks/stripe",
  ];

  return publicEndpoints.some((endpoint) => pathname.startsWith(endpoint));
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    // Apply to all API routes
    "/api/:path*",
    // Apply to dashboard routes
    "/dashboard/:path*",
    // Apply to authentication pages
    "/auth/:path*",
    // Exclude static files and images
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
