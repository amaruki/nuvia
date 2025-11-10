/**
 * Simplified authentication middleware
 *
 * This module provides clean, reusable middleware functions for authentication,
 * authorization, and access control without the complexity and redundancy of the original.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from './utils';
import { AuthResponseFactory, AuthErrorType } from './common';
import { RateLimiter, RATE_LIMIT_CONFIGS } from './rate-limiting';

// TODO: Add support for role-based access control (RBAC) system
// TODO: Add support for resource-based permissions
// TODO: Add support for API key authentication

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  /** Required role(s) for access */
  roles?: string | string[];
  /** Rate limiting configuration */
  rateLimit?: keyof typeof RATE_LIMIT_CONFIGS;
  /** Custom authentication logic */
  customAuth?: (request: NextRequest) => Promise<boolean>;
  /** Custom authorization logic */
  customAuthz?: (request: NextRequest, userId: string) => Promise<boolean>;
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
        error: AuthResponseFactory.authError()
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    return {
      success: false,
      error: AuthResponseFactory.authError('Authentication failed')
    };
  }
}

/**
 * Authorization middleware with role checking
 */
export async function authorize(
  request: NextRequest,
  user: any,
  roles?: string | string[]
): Promise<AuthResult> {
  if (!roles || roles.length === 0) {
    return { success: true, user };
  }

  try {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const userRole = user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      return {
        success: false,
        error: AuthResponseFactory.authorizationError(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        )
      };
    }

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: AuthResponseFactory.authorizationError('Authorization failed')
    };
  }
}

/**
 * Higher-order function for authentication middleware
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Check if should skip authentication
    if (shouldSkipAuth(request, options)) {
      return handler(request, null as any, ...args);
    }

    // Apply rate limiting if configured
    if (options.rateLimit) {
      const rateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS[options.rateLimit]);
      const rateLimitResult = await rateLimiter.check(request);

      if (rateLimitResult.isLimited) {
        return rateLimiter.createLimitResponse(rateLimitResult);
      }

      // Add rate limit headers to response
      const response = await executeHandler();
      return rateLimiter.addHeaders(response, rateLimitResult);
    }

    // Execute the handler with authentication
    return executeHandler();

    async function executeHandler(): Promise<NextResponse> {
      // Custom authentication if provided
      if (options.customAuth) {
        const isAuthorized = await options.customAuth(request);
        if (!isAuthorized) {
          return AuthResponseFactory.authError('Custom authentication failed');
        }
      }

      // Standard authentication
      const authResult = await authenticate(request);
      if (!authResult.success) {
        return authResult.error!;
      }

      // Authorization with roles
      if (options.roles) {
        const authzResult = await authorize(request, authResult.user, options.roles);
        if (!authzResult.success) {
          return authzResult.error!;
        }
      }

      // Custom authorization if provided
      if (options.customAuthz) {
        const isAuthorized = await options.customAuthz(request, authResult.user.id);
        if (!isAuthorized) {
          return AuthResponseFactory.authorizationError('Custom authorization failed');
        }
      }

      // Execute the handler with authenticated user
      return handler(request, authResult.user, ...args);
    }
  };
}

/**
 * Higher-order function for requiring specific roles
 */
export function withRole<T extends any[]>(
  roles: string | string[],
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>,
  options: Omit<MiddlewareOptions, 'roles'> = {}
) {
  return withAuth(handler, { ...options, roles });
}

/**
 * Higher-order function for resource-based authorization
 */
export function withResourceAuth<T extends any[]>(
  resourceIdParam: string,
  checkAccess: (userId: string, resourceId: string) => Promise<boolean>,
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return withAuth(async (request: NextRequest, user: any, ...args: T) => {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get(resourceIdParam) ||
                     request.nextUrl.pathname.split('/').pop();

    if (!resourceId) {
      return AuthResponseFactory.businessLogicError(
        `Resource identifier '${resourceIdParam}' is required`
      );
    }

    const hasAccess = await checkAccess(user.id, resourceId);
    if (!hasAccess) {
      return AuthResponseFactory.authorizationError(
        'Access denied to this resource'
      );
    }

    return handler(request, user, ...args);
  }, options);
}

/**
 * Check if authentication should be skipped for this request
 */
function shouldSkipAuth(request: NextRequest, options: MiddlewareOptions): boolean {
  const pathname = new URL(request.url).pathname;

  // Skip based on paths
  if (options.skipPaths?.some(path => pathname.includes(path))) {
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
        return AuthResponseFactory.authError('Authentication required');
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

/**
 * Preconfigured middleware for common use cases
 */
export const authMiddleware = {
  /** Standard authentication middleware */
  auth: <T extends any[]>(handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>) =>
    withAuth(handler),

  /** Admin-only middleware */
  admin: <T extends any[]>(handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>) =>
    withRole('admin', handler),

  /** User-only middleware */
  user: <T extends any[]>(handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>) =>
    withRole('user', handler),

  /** Rate-limited authentication endpoints */
  authEndpoint: <T extends any[]>(handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>) =>
    withAuth(handler, { rateLimit: 'AUTH' }),

  /** Rate-limited password reset endpoints */
  passwordResetEndpoint: <T extends any[]>(handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>) =>
    withAuth(handler, { rateLimit: 'PASSWORD_RESET' }),

  /** Rate-limited registration endpoints */
  registrationEndpoint: <T extends any[]>(handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>) =>
    withAuth(handler, { rateLimit: 'REGISTRATION' })
};