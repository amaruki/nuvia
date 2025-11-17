/**
 * Rate Limiting Utility
 *
 * Simple rate limiting functionality for API endpoints
 * and sensitive operations.
 */

export class SimpleRateLimiter {
  private static instances: Map<string, SimpleRateLimiter> = new Map();

  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  static getInstance(key: string, maxAttempts?: number, windowMs?: number): SimpleRateLimiter {
    if (!SimpleRateLimiter.instances.has(key)) {
      SimpleRateLimiter.instances.set(key, new SimpleRateLimiter(maxAttempts, windowMs));
    }
    return SimpleRateLimiter.instances.get(key)!;
  }

  async isAllowed(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.attempts.get(identifier);

    if (!existing || now > existing.resetTime) {
      // Reset or create new window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });

      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: now + this.windowMs
      };
    }

    // Check if limit exceeded
    if (existing.count >= this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime
      };
    }

    // Increment counter
    existing.count++;

    return {
      allowed: true,
      remaining: this.maxAttempts - existing.count,
      resetTime: existing.resetTime
    };
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Rate limiters for different operations
export const rateLimiters = {
  login: new SimpleRateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  passwordReset: new SimpleRateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  roleChange: new SimpleRateLimiter(10, 60 * 60 * 1000), // 10 role changes per hour
  sensitiveAction: new SimpleRateLimiter(20, 60 * 60 * 1000) // 20 sensitive actions per hour
};

/**
 * Create a standard rate limit response
 */
export function createRateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}