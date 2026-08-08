import { ApiClientError } from "@/lib/api-client";

/** Extracts a user-facing message from an API or unknown failure. */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
