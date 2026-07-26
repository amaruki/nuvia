/**
 * Authentication middleware used by src/proxy.ts.
 *
 * Only createAuthMiddleware (and the authenticate() it calls internally) is
 * live — see docs/adr/0001-one-authorization-helper.md for why per-route
 * authorization goes through rbac.ts's requirePermission/requireRole
 * instead of a middleware wrapper.
 */

import { NextRequest, NextResponse } from "next/server";
import { AuthUtils } from "./utils";
import { AuthResponseFactory } from "./common";
import { RateLimiter, RATE_LIMIT_CONFIGS } from "./rate-limiting";

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  /** Rate limiting configuration */
  rateLimit?: keyof typeof RATE_LIMIT_CONFIGS;
  /** Custom authentication logic */
  customAuth?: (request: NextRequest) => Promise<boolean>;
  /** Skip authentication for certain paths */
  skipPaths?: string[];
  /** Skip authentication for certain HTTP methods */
  skipMethods?: string[];
}

/**
 * Authentication result
 */
interface AuthResult {
  success: boolean;
  user?: any;
  error?: NextResponse;
}

/**
 * Base authentication middleware
 */
export async function authenticate(request: NextRequest): Promise<AuthResult> {
  try {
    const user = await AuthUtils.getCurrentUser(request);

    if (!user) {
      return {
        success: false,
        error: AuthResponseFactory.authError(),
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: AuthResponseFactory.authError("Authentication failed"),
    };
  }
}

/**
 * Check if authentication should be skipped for this request
 */
function shouldSkipAuth(request: NextRequest, options: MiddlewareOptions): boolean {
  const pathname = new URL(request.url).pathname;

  // Skip based on paths
  if (options.skipPaths?.some((path) => pathname.includes(path))) {
    return true;
  }

  // Skip based on HTTP methods
  if (options.skipMethods?.includes(request.method)) {
    return true;
  }

  return false;
}

/**
 * Middleware factory for Next.js middleware.ts
 */
export function createAuthMiddleware(options: MiddlewareOptions = {}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    if (shouldSkipAuth(request, options)) {
      return null; // Continue to next middleware or route
    }

    // Apply rate limiting if configured
    if (options.rateLimit) {
      const rateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS[options.rateLimit]);
      const rateLimitResult = await rateLimiter.check(request);

      if (rateLimitResult.isLimited) {
        return rateLimiter.createLimitResponse(rateLimitResult);
      }
    }

    // Authentication check
    if (options.customAuth) {
      const isAuthorized = await options.customAuth(request);
      if (!isAuthorized) {
        return AuthResponseFactory.authError("Authentication required");
      }
    } else {
      const authResult = await authenticate(request);
      if (!authResult.success) {
        return authResult.error!;
      }
    }

    return null; // Continue to route handler
  };
}
