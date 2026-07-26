/**
 * Core authentication utilities and standardized response handling
 *
 * This module provides a centralized location for common authentication functions,
 * error handling patterns, and response formatting to eliminate code duplication.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API response format for all authentication operations
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: Record<string, string[]>;
  meta: {
    timestamp: Date;
    version: string;
  };
}

/**
 * Standard authentication error types
 */
export enum AuthErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  BUSINESS_LOGIC = "BUSINESS_LOGIC_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  INTERNAL = "INTERNAL_ERROR",
}

/**
 * Standardized authentication error class
 */
export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Centralized response factory for consistent API responses
 */
export class AuthResponseFactory {
  private static readonly VERSION = "v1";

  /**
   * Create a successful response
   */
  static success<T>(data: T, message = "Operation successful"): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date(),
        version: this.VERSION,
      },
    });
  }

  /**
   * Create an error response
   */
  static error(
    type: AuthErrorType,
    message: string,
    fields?: Record<string, string[]>,
    status = 400,
  ): NextResponse<ApiResponse> {
    const response = {
      success: false,
      data: null,
      message,
      errors: fields,
      meta: {
        timestamp: new Date(),
        version: this.VERSION,
      },
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a validation error response from ZodError
   */
  static validationError(error: ZodError): NextResponse<ApiResponse> {
    const fields = error.issues.reduce(
      (acc, err) => {
        const field = err.path.join(".");
        if (!acc[field]) acc[field] = [];
        acc[field].push(err.message);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return this.error(AuthErrorType.VALIDATION, "Validation failed", fields, 400);
  }

  /**
   * Create an authentication error response
   */
  static authError(message = "Authentication failed"): NextResponse<ApiResponse> {
    return this.error(AuthErrorType.AUTHENTICATION, message, undefined, 401);
  }

  /**
   * Create an authorization error response
   */
  static authorizationError(message = "Access denied"): NextResponse<ApiResponse> {
    return this.error(AuthErrorType.AUTHORIZATION, message, undefined, 403);
  }

  /**
   * Create a not found error response
   */
  static notFound(resource: string, identifier?: string): NextResponse<ApiResponse> {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    return this.error(AuthErrorType.NOT_FOUND, message, undefined, 404);
  }

  /**
   * Create a rate limit error response
   */
  static rateLimitError(resetTime?: Date): NextResponse<ApiResponse> {
    const response = this.error(
      AuthErrorType.RATE_LIMIT,
      "Too many requests. Please try again later.",
      undefined,
      429,
    );

    if (resetTime) {
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
      response.headers.set("Retry-After", retryAfter.toString());
    }

    return response;
  }

  /**
   * Create a business logic error response
   */
  static businessLogicError(message: string, code?: string): NextResponse<ApiResponse> {
    return this.error(AuthErrorType.BUSINESS_LOGIC, message, undefined, 400);
  }

  /**
   * Create an internal server error response
   */
  static internalError(message = "Internal server error"): NextResponse<ApiResponse> {
    return this.error(AuthErrorType.INTERNAL, message, undefined, 500);
  }
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Convert various error types to standardized AuthError
 */
export function normalizeAuthError(error: unknown): AuthError {
  if (isAuthError(error)) return error;

  if (error instanceof ZodError) {
    const fields = error.issues.reduce(
      (acc, err) => {
        const field = err.path.join(".");
        if (!acc[field]) acc[field] = [];
        acc[field].push(err.message);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return new AuthError(AuthErrorType.VALIDATION, "Validation failed", fields);
  }

  if (error instanceof Error) {
    // Map common error patterns to AuthError types
    if (error.message.includes("Unauthorized") || error.message.includes("Authentication")) {
      return new AuthError(AuthErrorType.AUTHENTICATION, error.message);
    }
    if (error.message.includes("Forbidden") || error.message.includes("Access denied")) {
      return new AuthError(AuthErrorType.AUTHORIZATION, error.message);
    }
    if (error.message.includes("not found")) {
      return new AuthError(AuthErrorType.NOT_FOUND, error.message);
    }
    if (error.message.includes("rate limit") || error.message.includes("too many requests")) {
      return new AuthError(AuthErrorType.RATE_LIMIT, error.message);
    }

    return new AuthError(AuthErrorType.INTERNAL, error.message);
  }

  return new AuthError(AuthErrorType.INTERNAL, "Unknown error occurred");
}

/**
 * Execute a function with standardized error handling
 */
export async function withAuthErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string;
    customErrorHandling?: (error: unknown) => NextResponse<ApiResponse>;
  },
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await operation();
    return AuthResponseFactory.success(result, options?.successMessage);
  } catch (error) {
    if (options?.customErrorHandling) {
      return options.customErrorHandling(error);
    }

    const authError = normalizeAuthError(error);
    return AuthResponseFactory.error(authError.type, authError.message, authError.fields);
  }
}
