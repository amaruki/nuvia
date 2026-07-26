/**
 * Consolidated rate limiting utilities for authentication and API endpoints
 *
 * This module centralizes all rate limiting logic to eliminate duplication and
 * provide consistent rate limiting across the application.
 */

import { NextRequest, NextResponse } from "next/server";
import { AuthResponseFactory } from "./common";

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: Date;
  totalRequests: number;
}

/**
 * In-memory storage for rate limiting (TODO: Replace with Redis for production)
 */
class InMemoryRateLimitStore {
  private storage = new Map<string, { count: number; resetTime: Date }>();

  get(key: string): { count: number; resetTime: Date } | null {
    const entry = this.storage.get(key);
    if (!entry) return null;

    if (Date.now() > entry.resetTime.getTime()) {
      this.storage.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, count: number, resetTime: Date): void {
    this.storage.set(key, { count, resetTime });
  }

  increment(key: string, windowMs: number): { count: number; resetTime: Date } {
    const existing = this.get(key);
    const resetTime = existing?.resetTime || new Date(Date.now() + windowMs);
    const count = existing ? existing.count + 1 : 1;

    this.set(key, count, resetTime);
    return { count, resetTime };
  }

  clear(): void {
    this.storage.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime.getTime()) {
        this.storage.delete(key);
      }
    }
  }
}

// Global store instance
const rateLimitStore = new InMemoryRateLimitStore();

// Clean up expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: NextRequest) =>
      `auth:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // Password reset endpoints
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req: NextRequest) =>
      `password-reset:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // Registration endpoints
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (req: NextRequest) =>
      `registration:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // General API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: NextRequest) =>
      `api:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // File upload endpoints
  FILE_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req: NextRequest) =>
      `upload:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },
} as const;

/**
 * Rate limiting middleware class
 */
export class RateLimiter {
  constructor(private config: RateLimitConfig) {}

  /**
   * Check if the request should be rate limited
   */
  async check(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator?.(request) || this.getDefaultKey(request);
    const { count, resetTime } = rateLimitStore.get(key) || { count: 0, resetTime: new Date() };

    // If window has expired, reset counter
    if (Date.now() > resetTime.getTime()) {
      const newEntry = rateLimitStore.increment(key, this.config.windowMs);
      return {
        isLimited: false,
        remainingRequests: Math.max(0, this.config.maxRequests - 1),
        resetTime: newEntry.resetTime,
        totalRequests: 1,
      };
    }

    // Check if limit exceeded
    if (count >= this.config.maxRequests) {
      return {
        isLimited: true,
        remainingRequests: 0,
        resetTime,
        totalRequests: count,
      };
    }

    // Increment counter
    const newEntry = rateLimitStore.increment(key, this.config.windowMs);
    return {
      isLimited: false,
      remainingRequests: Math.max(0, this.config.maxRequests - newEntry.count),
      resetTime: newEntry.resetTime,
      totalRequests: newEntry.count,
    };
  }

  /**
   * Create a rate limit response
   */
  createLimitResponse(result: RateLimitResult): NextResponse {
    const response = AuthResponseFactory.rateLimitError(result.resetTime);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", this.config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remainingRequests.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(result.resetTime.getTime() / 1000).toString(),
    );

    return response;
  }

  /**
   * Add rate limit headers to successful response
   */
  addHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
    response.headers.set("X-RateLimit-Limit", this.config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remainingRequests.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(result.resetTime.getTime() / 1000).toString(),
    );

    return response;
  }

  /**
   * Default key generator using IP address
   */
  private getDefaultKey(request: NextRequest): string {
    return `rate-limit:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`;
  }
}

/**
 * Create a rate-limited handler (TODO: Add support for custom key generators)
 */
export function createRateLimitedHandler<T extends any[]>(
  config: RateLimitConfig,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
) {
  const rateLimiter = new RateLimiter(config);

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const rateLimitResult = await rateLimiter.check(request);

    if (rateLimitResult.isLimited) {
      return rateLimiter.createLimitResponse(rateLimitResult);
    }

    const response = await handler(request, ...args);
    return rateLimiter.addHeaders(response, rateLimitResult);
  };
}

/**
 * Higher-order function for rate limiting specific endpoints
 */
export function withRateLimiting<T extends any[]>(
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
) {
  const config = RATE_LIMIT_CONFIGS[configName];
  return createRateLimitedHandler(config, handler);
}

/**
 * Rate limiting middleware for Next.js middleware (TODO: Add support for distributed rate limiting)
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const rateLimiter = new RateLimiter(config);

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const rateLimitResult = await rateLimiter.check(request);

    if (rateLimitResult.isLimited) {
      return rateLimiter.createLimitResponse(rateLimitResult);
    }

    // Add rate limit headers to the request for later use
    request.headers.set("x-rate-limit-remaining", rateLimitResult.remainingRequests.toString());

    return null; // Continue processing
  };
}

/**
 * Legacy compatibility function - replaces createRateLimitResponse
 */
export function createRateLimitResponse(rateLimitResult: RateLimitResult): NextResponse {
  const rateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  });

  return rateLimiter.createLimitResponse(rateLimitResult);
}

/**
 * Utility function to get rate limit headers
 */
export function getRateLimitHeaders(
  rateLimitResult: RateLimitResult,
  maxRequests: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": rateLimitResult.remainingRequests.toString(),
    "X-RateLimit-Reset": Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString(),
  };
}
