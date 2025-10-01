'use server';

import { signInWithOAuth } from '@/lib/utils/better-auth-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/response-utils';
import { BusinessLogicError } from '@/lib/errors';

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
export async function signInWithOAuthAction(
  provider: string,
  callbackURL?: string
) {
  console.log("signInWithOAuthAction called:", { provider, callbackURL });

  try {
    const result = await signInWithOAuth(provider, callbackURL);

    console.log("OAuth sign-in result:", result);

    // better-auth OAuth response structure
    // The response might have different structures depending on the auth state
    let redirectUrl: string | undefined;
    
    // Check if result has a direct URL property
    if ('url' in result && result.url) {
      redirectUrl = result.url as string;
    }
    // Check if result has a data property with URL (for backward compatibility)
    else if ('data' in result && result.data && typeof result.data === 'object' && 'url' in result.data) {
      redirectUrl = (result.data as { url: string }).url;
    }
    // Check if result has a redirect property that contains the URL
    else if ('redirect' in result && typeof result.redirect === 'string') {
      redirectUrl = result.redirect;
    }

    if (redirectUrl) {
      return createSuccessResponse({
        url: redirectUrl,
        provider,
      });
    }

    throw new BusinessLogicError(
      'No OAuth redirect URL received',
      'OAUTH_NO_REDIRECT_URL'
    );
  } catch (error) {
    console.error("OAuth sign-in action error:", {
      provider,
      callbackURL,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof BusinessLogicError) {
      return createErrorResponse(
        error.message,
        error.code || 'OAUTH_SIGNIN_FAILED'
      );
    }

    return createErrorResponse(
      'Failed to initiate OAuth sign-in',
      'OAUTH_SIGNIN_FAILED'
    );
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

    return createSuccessResponse({
      provider,
      configured: isConfigured,
    });
  } catch {
    return createErrorResponse(
      'Failed to check OAuth provider configuration',
      'OAUTH_CONFIG_CHECK_FAILED'
    );
  }
}

/**
 * Get all available OAuth providers
 *
 * @returns Success response with available providers
 */
export async function getAvailableOAuthProvidersAction() {
  try {
    const providers = ['google', 'github', 'linkedin'];
    const availableProviders = providers.filter(provider =>
      checkProviderConfig(provider)
    );

    return createSuccessResponse({
      providers: availableProviders,
    });
  } catch {
    return createErrorResponse(
      'Failed to get available OAuth providers',
      'OAUTH_PROVIDERS_RETRIEVAL_FAILED'
    );
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
    case 'google':
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case 'github':
      return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    case 'linkedin':
      return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    default:
      return false;
  }
}