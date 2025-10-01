/**
 * Create a success response
 *
 * @param data - Response data
 * @param message - Optional success message
 * @returns Formatted success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message: string = 'Success'
) {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date(),
      version: 'v1',
    },
  };
}

/**
 * Create an error response
 *
 * @param message - Error message
 * @param code - Error code
 * @param errors - Optional validation errors
 * @returns Formatted error response
 */
export function createErrorResponse(
  message: string,
  code: string = 'UNKNOWN_ERROR',
  errors?: Record<string, string[]> | Array<{ field: string; message: string }>
) {
  return {
    success: false,
    message,
    data: null,
    errors: errors ? normalizeErrors(errors) : undefined,
    meta: {
      timestamp: new Date(),
      version: 'v1',
    },
  };
}

/**
 * Normalize errors to the expected format
 * 
 * @param errors - Errors in various formats
 * @returns Normalized errors
 */
function normalizeErrors(
  errors: Record<string, string[]> | Array<{ field: string; message: string }>
): Record<string, string[]> {
  if (Array.isArray(errors)) {
    // Convert array of field errors to record
    const normalized: Record<string, string[]> = {};
    errors.forEach(error => {
      if (!normalized[error.field]) {
        normalized[error.field] = [];
      }
      normalized[error.field].push(error.message);
    });
    return normalized;
  }

  // Already in the correct format
  return errors;
}