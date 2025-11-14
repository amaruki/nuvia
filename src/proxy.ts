/**
 * Consolidated Next.js middleware
 *
 * This middleware uses our refactored auth and rate limiting modules to provide
 * consistent security and rate limiting across the application.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/auth/middleware';

import { RATE_LIMIT_CONFIGS } from '@/lib/auth/rate-limiting';
import { AuthResponseFactory } from '@/lib/auth/common';

// TODO: Add support for API key authentication for external services
// TODO: Add support for request logging and analytics
// TODO: Add support for CORS configuration

/**
 * Create middleware with authentication and rate limiting
 */
const authMiddleware = createAuthMiddleware({
  rateLimit: 'API',
  skipPaths: ['/api/auth/callback'], // Skip auth for OAuth callbacks
});

/**
 * Main middleware function
 */
export async function proxy(request: NextRequest) {
  try {
    // Protect dashboard routes - require authentication
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const authResult = await authenticate(request);
      if (!authResult.success) {
        // Redirect to login page with return URL
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Continue to dashboard page if authenticated
      return NextResponse.next();
    }

    // Apply authentication middleware to API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
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
    console.error('Middleware error:', error);
    return AuthResponseFactory.internalError('Internal server error');
  }
}

/**
 * Simple authentication check for middleware
 */
async function authenticate(request: NextRequest): Promise<{ success: boolean; user?: any }> {
  try {
    // Import auth utilities dynamically to avoid server-side issues
    const { AuthUtils } = await import('@/lib/auth/utils');
    const user = await AuthUtils.getCurrentUser(request);

    if (!user) {
      return { success: false };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false };
  }
}

/**
 * Check if the endpoint is public and doesn't require authentication
 */
function isPublicEndpoint(pathname: string): boolean {
  const publicEndpoints = [
    '/api/auth/callback', // OAuth callbacks
    '/api/v1/auth/login',   // Login endpoints
    '/api/v1/auth/register', // Registration endpoints
    '/api/v1/auth/reset-password', // Password reset
    '/api/v1/auth/verify-email', // Email verification
    // TODO: Add other public endpoints as needed
  ];

  return publicEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to dashboard routes
    '/dashboard/:path*',
    // Apply to authentication pages
    '/auth/:path*',
    // Exclude static files and images
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};