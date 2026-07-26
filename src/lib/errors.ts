/**
 * Custom error classes for the application
 */

export class ValidationError extends Error {
  public fields: Array<{ field: string; message: string }>;

  constructor(fields: Array<{ field: string; message: string }>) {
    super("Validation failed");
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NotFoundError extends Error {
  public resource: string;
  public id: string;

  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class BusinessLogicError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "BusinessLogicError";
    this.code = code;
  }
}

export class RateLimitError extends Error {
  public retryAfter: number;

  constructor(message: string = "Rate limit exceeded", retryAfter: number = 60) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class DatabaseError extends Error {
  public originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "DatabaseError";
    this.originalError = originalError;
  }
}

export class EmailError extends Error {
  constructor(message: string = "Email service error") {
    super(message);
    this.name = "EmailError";
  }
}

export class ExternalServiceError extends Error {
  public service: string;

  constructor(message: string, service: string) {
    super(message);
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

/**
 * Helper function to create a standardized error response
 * @param error - The error object
 * @returns Object with standardized error format
 */
export function createErrorResponse(error: Error) {
  let statusCode = 500;
  let errors: Record<string, string[]> = {};

  if (error instanceof ValidationError) {
    statusCode = 400;
    errors = error.fields.reduce(
      (acc, field) => {
        if (!acc[field.field]) {
          acc[field.field] = [];
        }
        acc[field.field].push(field.message);
        return acc;
      },
      {} as Record<string, string[]>,
    );
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errors = {
      resource: [error.message],
    };
  } else if (error instanceof AuthorizationError) {
    statusCode = 401;
    errors = {
      authorization: [error.message],
    };
  } else if (error instanceof BusinessLogicError) {
    statusCode = 422;
    errors = {
      business: [error.message],
    };
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    errors = {
      rateLimit: [error.message],
    };
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    errors = {
      authentication: [error.message],
    };
  } else if (error instanceof DatabaseError) {
    statusCode = 500;
    errors = {
      database: ["A database error occurred"],
    };
  } else if (error instanceof EmailError) {
    statusCode = 500;
    errors = {
      email: ["An email service error occurred"],
    };
  } else if (error instanceof ExternalServiceError) {
    statusCode = 502;
    errors = {
      external: [error.message],
    };
  } else if (error instanceof OAuthConflictError) {
    statusCode = 409;
    errors = {
      oauth: [error.message],
    };
  }

  return {
    success: false,
    data: undefined,
    message: error.message,
    errors,
    meta: {
      timestamp: new Date(),
      version: "v1",
    },
  };
}

/**
 * Helper function to create a success response
 * @param data - The data to include in the response
 * @param message - Optional success message
 * @returns Object with standardized success format
 */
export function createSuccessResponse(data: any, message: string = "Success") {
  return {
    success: true,
    data: data === null ? undefined : data,
    message,
    errors: undefined,
    meta: {
      timestamp: new Date(),
      version: "v1",
    },
  };
}

/**
 * Helper function to handle async errors in route handlers
 * @param fn - The async function to wrap
 * @returns Wrapped function with error handling
 */
export function asyncHandler<T extends any[], R>(fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        throw error; // Re-throw known errors
      }
      // Wrap unknown errors
      throw new Error(`An unexpected error occurred: ${String(error)}`);
    }
  };
}

/**
 * Helper function to validate environment variables
 * @param requiredVars - Array of required environment variable names
 * @throws Error if any required variable is missing
 */
export function validateEnvironmentVariables(requiredVars: string[]): void {
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }
}

/**
 * Helper function to log errors with context
 * @param error - The error to log
 * @param context - Additional context information
 */
export function logError(error: Error, context: Record<string, any> = {}): void {
  console.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
}

export class OAuthConflictError extends Error {
  public email: string;
  public existingMethod: string;
  public attemptedMethod: string;

  constructor(email: string, existingMethod: string, attemptedMethod: string, message?: string) {
    super(
      message ||
        `Email ${email} is already registered with ${existingMethod}. Cannot use ${attemptedMethod}.`,
    );
    this.name = "OAuthConflictError";
    this.email = email;
    this.existingMethod = existingMethod;
    this.attemptedMethod = attemptedMethod;
  }
}
