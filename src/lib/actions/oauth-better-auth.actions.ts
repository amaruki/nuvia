"use server";

import { auth } from "@/lib/auth";
import { AuthResponseFactory, clientSafeAuthMessage } from "@/lib/auth/common";
import { BusinessLogicError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * OAuth Actions using better-auth (Server-side)
 *
 * These actions use better-auth's built-in OAuth functionality
 * instead of custom OAuth implementation.
 */

/**
 * Initiate OAuth sign-in with provider
 *
 * @param provider - OAuth provider (google, github, etc.)
 * @param callbackURL - URL to redirect to after successful authentication
 * @returns Success response with OAuth URL
 */
export async function signInWithOAuthAction(provider: string, callbackURL?: string) {
  try {
    // Validate provider
    if (!checkProviderConfig(provider)) {
      throw new BusinessLogicError(
        `OAuth provider ${provider} is not configured`,
        "OAUTH_PROVIDER_NOT_CONFIGURED",
      );
    }

    // Use Better Auth API for OAuth sign in
    const result = await auth.api.signInSocial({
      body: {
        provider: provider as any,
        callbackURL: callbackURL || "/dashboard",
      },
    });

    // Better Auth returns URL for redirect
    if (result.url) {
      return {
        success: true,
        data: {
          url: result.url,
          provider,
        },
        message: "OAuth sign-in initiated successfully",
      };
    }

    throw new BusinessLogicError("No OAuth redirect URL received", "OAUTH_NO_REDIRECT_URL");
  } catch (error) {
    logger.error("OAuth sign-in error", error);

    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to initiate OAuth sign-in"),
      errors: { server: [clientSafeAuthMessage(error, "OAuth sign-in failed")] },
    };
  }
}

/**
 * Get OAuth configuration status for a provider
 *
 * @param provider - OAuth provider to check
 * @returns Success response with configuration status
 */
export async function getOAuthProviderConfigAction(provider: string) {
  try {
    // Check if provider is configured by checking environment variables
    const isConfigured = checkProviderConfig(provider);

    return {
      success: true,
      data: {
        provider,
        configured: isConfigured,
      },
      message: "OAuth provider configuration retrieved successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to check OAuth provider configuration"),
      errors: { server: ["OAUTH_CONFIG_CHECK_FAILED"] },
    };
  }
}

/**
 * Get all available OAuth providers
 *
 * @returns Success response with available providers
 */
export async function getAvailableOAuthProvidersAction() {
  try {
    const providers = ["google", "github", "linkedin"];
    const availableProviders = providers.filter((provider) => checkProviderConfig(provider));

    return {
      success: true,
      data: {
        providers: availableProviders,
      },
      message: "Available OAuth providers retrieved successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to get available OAuth providers"),
      errors: { server: ["OAUTH_PROVIDERS_RETRIEVAL_FAILED"] },
    };
  }
}

/**
 * Get OAuth provider configuration
 *
 * @param provider - OAuth provider to check
 * @returns Success response with provider configuration
 */
export async function getOAuthProviderConfigurationAction(provider: string) {
  try {
    const isConfigured = checkProviderConfig(provider);
    const redirectUri = `${process.env.APP_URL}/api/auth/callback/${provider}`;

    return {
      success: true,
      data: {
        provider,
        configured: isConfigured,
        redirectUri,
      },
      message: "OAuth provider configuration retrieved successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to get OAuth provider configuration"),
      errors: { server: ["OAUTH_CONFIG_RETRIEVAL_FAILED"] },
    };
  }
}

/**
 * Check if OAuth provider is properly configured
 *
 * @param provider - OAuth provider to check
 * @returns True if provider is configured
 */
function checkProviderConfig(provider: string): boolean {
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
