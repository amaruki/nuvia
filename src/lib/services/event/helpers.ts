import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  BusinessLogicError,
} from "@/lib/errors";

/**
 * Helper function to handle API responses
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      // RFC 9457 problems carry `detail`; legacy payloads used `message`.
      errorMessage = errorData.detail || errorData.message || errorMessage;

      // Map HTTP status codes to custom error types
      if (response.status === 400) {
        throw new ValidationError(normalizeFieldErrors(errorData.errors, errorMessage));
      } else if (response.status === 401) {
        throw new AuthorizationError("Unauthorized access");
      } else if (response.status === 403) {
        throw new AuthorizationError(errorData.detail || "Insufficient permissions");
      } else if (response.status === 404) {
        throw new NotFoundError("Resource", "unknown");
      } else if (response.status === 409) {
        throw new BusinessLogicError(errorMessage, "CONFLICT");
      } else if (response.status === 422) {
        throw new ValidationError(normalizeFieldErrors(errorData.errors, errorMessage));
      }
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof AuthorizationError ||
        error instanceof BusinessLogicError
      ) {
        throw error;
      }
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Accepts both RFC 9457 validation payloads (`errors: [{ field, message }]`)
 * and the legacy record shape (`errors: { field: [messages] }`) and returns
 * the flat field-error list the UI error classes consume.
 */
function normalizeFieldErrors(
  rawErrors: unknown,
  fallbackMessage: string,
): Array<{ field: string; message: string }> {
  if (Array.isArray(rawErrors)) {
    const fields = rawErrors
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        field: String((entry as { field?: unknown }).field ?? "general"),
        message: String((entry as { message?: unknown }).message ?? fallbackMessage),
      }));
    if (fields.length > 0) return fields;
  } else if (rawErrors && typeof rawErrors === "object") {
    return Object.entries(rawErrors as Record<string, string[]>).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message: String(message) })),
    );
  }
  return [{ field: "general", message: fallbackMessage }];
}
