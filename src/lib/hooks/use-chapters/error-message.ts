import { ApiClientError } from "@/lib/api-client";

/** Extracts a user-facing message from an API failure, else the fallback. */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message;
  return fallback;
}
