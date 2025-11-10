import { ReadonlyURLSearchParams } from "next/navigation";
import type { OAuthProvider } from "@/types/auth.types";

export interface OAuthErrorInfo {
  code: string;
  message: string;
  provider?: OAuthProvider;
}

/**
 * OAuth error codes and their default messages
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_conflict: "This email is already registered with a different authentication method. Please sign in using the same method you used to register.",
  oauth_callback_error: "Authentication was cancelled or failed. Please try again.",
  access_denied: "Access was denied. Please grant the necessary permissions to continue.",
  authentication_failed: "Authentication failed. Please try again.",
  invalid_request: "Invalid authentication request. Please try again.",
  server_error: "Authentication server error. Please try again later.",
  timeout: "Authentication timed out. Please try again.",
};

/**
 * Extracts OAuth error information from URL search parameters
 *
 * @param searchParams - URL search parameters from auth callback
 * @returns OAuth error information or null if no error found
 */
export function extractOAuthError(searchParams: ReadonlyURLSearchParams): OAuthErrorInfo | null {
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const provider = searchParams.get("provider") as OAuthProvider | undefined;

  if (!error) {
    return null;
  }

  // Handle specific OAuth conflict error with custom description
  if (error === "oauth_conflict") {
    return {
      code: error,
      message: errorDescription || OAUTH_ERROR_MESSAGES.oauth_conflict,
      provider,
    };
  }

  // Handle other OAuth errors
  const message = errorDescription || OAUTH_ERROR_MESSAGES[error] || "Authentication failed";

  return {
    code: error,
    message,
    provider,
  };
}

/**
 * Checks if a URL contains OAuth error parameters
 *
 * @param searchParams - URL search parameters to check
 * @returns True if OAuth error parameters are present
 */
export function hasOAuthError(searchParams: ReadonlyURLSearchParams): boolean {
  return !!(
    searchParams.get("error") ||
    searchParams.get("error_description") ||
    searchParams.get("provider")
  );
}

/**
 * Cleans up OAuth error parameters from the URL
 * Uses history.replaceState to remove error parameters without page reload
 */
export function cleanOAuthUrlParams(): void {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const paramsToRemove = ["error", "error_description", "provider", "code", "state"];

    paramsToRemove.forEach(param => url.searchParams.delete(param));

    // Update URL without parameters
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
}

/**
 * Creates a user-friendly error message for OAuth errors
 *
 * @param error - OAuth error information
 * @returns User-friendly error message
 */
export function formatOAuthErrorMessage(error: OAuthErrorInfo): string {
  if (error.code === "oauth_conflict") {
    return error.message;
  }

  if (error.provider) {
    return `${error.provider.charAt(0).toUpperCase() + error.provider.slice(1)} authentication: ${error.message}`;
  }

  return error.message;
}

/**
 * Validates OAuth provider configuration
 *
 * @param provider - OAuth provider to validate
 * @returns True if provider is properly configured
 */
export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  switch (provider) {
    case "google":
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "github":
      return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    case "linkedin":
      return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    default:
      return false;
  }
}