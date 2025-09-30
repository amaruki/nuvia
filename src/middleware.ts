import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters, getRateLimitHeaders, createRateLimitResponse } from '@/lib/utils/rate-limiter';

/**
 * Middleware for rate limiting and other global security measures
 */
export async function middleware(request: NextRequest) {
  // Apply global rate limiting to all authentication endpoints
  if (request.nextUrl.pathname.startsWith('/api/v1/auth/')) {
    const rateLimitResult = await rateLimiters.global(request);
    
    if (rateLimitResult.isLimited) {
      const headers = getRateLimitHeaders(rateLimitResult);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Too many requests. Please try again later.',
          errors: {
            rateLimit: ['Rate limit exceeded. Please try again later.'],
          },
          meta: {
            timestamp: new Date(),
            version: 'v1',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }
    
    // Add rate limit headers to all responses
    const response = NextResponse.next();
    const headers = getRateLimitHeaders(rateLimitResult);
    
    // Add headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // For non-authentication endpoints, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to authentication pages
    '/auth/:path*',
  ],
};