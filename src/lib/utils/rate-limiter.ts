import type { NextRequest } from 'next/server';
import type { RateLimitInfo } from '../../types/auth.types';

// In-memory storage for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests allowed in the window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Global rate limits (middleware level)
  GLOBAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  
  // API route specific rate limits
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  
  SIGNUP: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
  },
  
  FORGOT_PASSWORD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 2, // 2 attempts per hour
  },
  
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
  },
  
  CHANGE_PASSWORD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
} as const;

/**
 * Create a rate limiter middleware
 * @param config - Rate limit configuration
 * @returns Function that checks rate limit
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: NextRequest): Promise<RateLimitInfo> {
    // Generate key for rate limiting
    const key = config.keyGenerator 
      ? config.keyGenerator(request)
      : getDefaultKey(request);
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get current rate limit data or create new
    let rateLimitData = rateLimitStore.get(key);
    
    // Reset if window has passed
    if (!rateLimitData || rateLimitData.resetTime < windowStart) {
      rateLimitData = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, rateLimitData);
    }
    
    // Check if request should be skipped based on success/failure
    const shouldSkip = checkIfShouldSkip(request, config);
    
    if (!shouldSkip) {
      // Increment counter
      rateLimitData.count++;
      rateLimitStore.set(key, rateLimitData);
    }
    
    // Calculate remaining requests
    const remaining = Math.max(0, config.maxRequests - rateLimitData.count);
    const isLimited = rateLimitData.count > config.maxRequests;
    
    return {
      attempts: rateLimitData.count,
      remaining,
      resetTime: new Date(rateLimitData.resetTime),
      isLimited,
    };
  };
}

/**
 * Get default rate limit key from request
 * @param request - The request object
 * @returns string - The rate limit key
 */
function getDefaultKey(request: NextRequest): string {
  const ip = getClientIP(request);
  const url = new URL(request.url);
  const path = url.pathname;
  
  // For login and forgot password, include email in key if available
  // Note: In a real implementation, you would need to parse the request body differently
  // as we can't easily access the request body here without cloning it
  // This is a simplified version that doesn't include email in the key
  
  return `${ip}:${path}`;
}

/**
 * Get client IP from request
 * @param request - The request object
 * @returns string - The client IP
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (cfIP) return cfIP;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) return realIP;
  
  // NextRequest doesn't have an ip property, so we return 'unknown'
  // In a real implementation, you might get this from a custom header or middleware
  return 'unknown';
}

/**
 * Check if request should be skipped based on success/failure
 * @param request - The request object
 * @param config - Rate limit configuration
 * @returns boolean - True if request should be skipped
 */
function checkIfShouldSkip(request: NextRequest, config: RateLimitConfig): boolean {
  // This is a simplified check
  // In a real implementation, you would need to check the response status
  // This could be done by wrapping the response handler
  
  return false;
}

/**
 * Create a rate limit key generator for specific routes
 * @param route - The route pattern
 * @returns Function that generates a rate limit key
 */
export function createKeyGenerator(route: string) {
  return (request: NextRequest): string => {
    const ip = getClientIP(request);
    return `${ip}:${route}`;
  };
}

/**
 * Clean up expired rate limit entries
 * This should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  // Use Array.from to convert the iterator to an array
  Array.from(rateLimitStore.entries()).forEach(([key, data]) => {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}

/**
 * Get rate limit headers for response
 * @param rateLimitInfo - Rate limit information
 * @returns Record<string, string> - Headers to include in response
 */
export function getRateLimitHeaders(rateLimitInfo: RateLimitInfo): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimitInfo.attempts.toString(),
    'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
    'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString(),
    'Retry-After': rateLimitInfo.isLimited 
      ? Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 1000).toString()
      : '0',
  };
}

/**
 * Create a rate limit error response
 * @param rateLimitInfo - Rate limit information
 * @returns Response - Rate limit error response
 */
export function createRateLimitResponse(rateLimitInfo: RateLimitInfo): Response {
  const headers = getRateLimitHeaders(rateLimitInfo);
  
  return new Response(
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

// Pre-configured rate limiters
export const rateLimiters = {
  global: createRateLimiter(RATE_LIMITS.GLOBAL),
  login: createRateLimiter({
    ...RATE_LIMITS.LOGIN,
    keyGenerator: createKeyGenerator('/api/v1/auth/login'),
  }),
  signup: createRateLimiter({
    ...RATE_LIMITS.SIGNUP,
    keyGenerator: createKeyGenerator('/api/v1/auth/signup'),
  }),
  forgotPassword: createRateLimiter({
    ...RATE_LIMITS.FORGOT_PASSWORD,
    keyGenerator: createKeyGenerator('/api/v1/auth/forgot-password'),
  }),
  passwordReset: createRateLimiter({
    ...RATE_LIMITS.PASSWORD_RESET,
    keyGenerator: createKeyGenerator('/api/v1/auth/reset-password'),
  }),
  changePassword: createRateLimiter({
    ...RATE_LIMITS.CHANGE_PASSWORD,
    keyGenerator: createKeyGenerator('/api/v1/auth/change-password'),
  }),
};

// Clean up rate limit store every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}