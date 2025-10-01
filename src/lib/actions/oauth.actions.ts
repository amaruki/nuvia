'use server';

import { auth } from '@/lib/auth';
import { oauthService } from '@/lib/services/oauth.service';
import { oauthManager } from '@/lib/managers/oauth.manager';
import { OAuthProvider, OAuthProfile } from '@/types/auth.types';
import { BusinessLogicError, ValidationError, NotFoundError } from '@/lib/errors';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/response-utils';

/**
 * OAuth Actions - Server-side OAuth operations
 * 
 * These actions handle OAuth authentication flows on the server side,
 * following the layered architecture pattern (Controller → Service → Manager).
 */

/**
 * Get OAuth authorization URL
 * 
 * @param provider - OAuth provider
 * @param callbackUrl - Optional callback URL
 * @returns Success response with authorization URL
 */
export async function getOAuthAuthorizationUrlAction(
  provider: OAuthProvider,
  callbackUrl?: string
) {
  try {
    const authorizationUrl = await oauthService.getAuthorizationUrl(provider, callbackUrl);
    
    return createSuccessResponse({
      authorizationUrl,
      provider,
    });
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return createErrorResponse(
        error.message,
        error.code || 'OAUTH_AUTHORIZATION_FAILED'
      );
    }
    
    if (error instanceof ValidationError) {
      return createErrorResponse(
        error.message,
        'OAUTH_AUTHORIZATION_FAILED',
        error.fields
      );
    }
    
    return createErrorResponse(
      'Failed to generate OAuth authorization URL',
      'OAUTH_AUTHORIZATION_FAILED'
    );
  }
}

/**
 * Handle OAuth callback
 * 
 * @param provider - OAuth provider
 * @param code - Authorization code
 * @param state - OAuth state parameter
 * @returns Success response with user and session data
 */
export async function handleOAuthCallbackAction(
  provider: OAuthProvider,
  code: string,
  state: string
) {
  try {
    const result = await oauthService.handleOAuthCallback(provider, code, state);
    
    return createSuccessResponse({
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return createErrorResponse(
        error.message,
        error.code || 'OAUTH_CALLBACK_FAILED'
      );
    }
    
    if (error instanceof ValidationError) {
      return createErrorResponse(
        error.message,
        'OAUTH_CALLBACK_FAILED',
        error.fields
      );
    }
    
    return createErrorResponse(
      'Failed to process OAuth callback',
      'OAUTH_CALLBACK_FAILED'
    );
  }
}

/**
 * Link OAuth account to current user
 * 
 * @param provider - OAuth provider
 * @param profile - OAuth profile data
 * @returns Success response with updated user
 */
export async function linkOAuthAccountAction(
  provider: OAuthProvider,
  profile: OAuthProfile
) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    if (!session?.user) {
      throw new BusinessLogicError(
        'You must be logged in to link an OAuth account',
        'UNAUTHORIZED'
      );
    }

    const user = await oauthService.linkOAuthAccount(
      session.user.id,
      provider,
      profile
    );
    
    return createSuccessResponse({
      user,
    });
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return createErrorResponse(
        error.message,
        error.code || 'OAUTH_LINKING_FAILED'
      );
    }
    
    if (error instanceof ValidationError) {
      return createErrorResponse(
        error.message,
        'OAUTH_LINKING_FAILED',
        error.fields
      );
    }
    
    return createErrorResponse(
      'Failed to link OAuth account',
      'OAUTH_LINKING_FAILED'
    );
  }
}

/**
 * Unlink OAuth account from current user
 * 
 * @param provider - OAuth provider to unlink
 * @returns Success response with updated user
 */
export async function unlinkOAuthAccountAction(
  provider: OAuthProvider
) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    if (!session?.user) {
      throw new BusinessLogicError(
        'You must be logged in to unlink an OAuth account',
        'UNAUTHORIZED'
      );
    }

    const user = await oauthService.unlinkOAuthAccount(session.user.id, provider);
    
    return createSuccessResponse({
      user,
    });
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return createErrorResponse(
        error.message,
        error.code || 'OAUTH_UNLINKING_FAILED'
      );
    }
    
    if (error instanceof ValidationError) {
      return createErrorResponse(
        error.message,
        'OAUTH_UNLINKING_FAILED',
        error.fields
      );
    }
    
    return createErrorResponse(
      'Failed to unlink OAuth account',
      'OAUTH_UNLINKING_FAILED'
    );
  }
}

/**
 * Get current user's linked OAuth accounts
 * 
 * @returns Success response with linked accounts
 */
export async function getLinkedOAuthAccountsAction() {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    if (!session?.user) {
      throw new BusinessLogicError(
        'You must be logged in to view linked accounts',
        'UNAUTHORIZED'
      );
    }

    const accounts = await oauthService.getLinkedAccounts(session.user.id);
    
    return createSuccessResponse({
      accounts,
    });
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return createErrorResponse(
        error.message,
        error.code || 'OAUTH_ACCOUNTS_RETRIEVAL_FAILED'
      );
    }
    
    if (error instanceof ValidationError) {
      return createErrorResponse(
        error.message,
        'OAUTH_ACCOUNTS_RETRIEVAL_FAILED',
        error.fields
      );
    }
    
    return createErrorResponse(
      'Failed to retrieve linked OAuth accounts',
      'OAUTH_ACCOUNTS_RETRIEVAL_FAILED'
    );
  }
}

/**
 * Check if OAuth provider is configured
 * 
 * @param provider - OAuth provider to check
 * @returns Success response with configuration status
 */
export async function checkOAuthProviderConfigAction(provider: OAuthProvider) {
  try {
    const isConfigured = oauthService.isProviderConfigured(provider);
    
    return createSuccessResponse({
      provider,
      configured: isConfigured,
    });
  } catch (error) {
    return createErrorResponse(
      'Failed to check OAuth provider configuration',
      'OAUTH_CONFIG_CHECK_FAILED'
    );
  }
}

/**
 * Get available OAuth providers
 * 
 * @returns Success response with available providers
 */
export async function getAvailableOAuthProvidersAction() {
  try {
    const providers: OAuthProvider[] = ['google', 'github', 'linkedin'];
    const availableProviders = providers.filter(provider => 
      oauthService.isProviderConfigured(provider)
    );
    
    return createSuccessResponse({
      providers: availableProviders,
    });
  } catch (error) {
    return createErrorResponse(
      'Failed to get available OAuth providers',
      'OAUTH_PROVIDERS_RETRIEVAL_FAILED'
    );
  }
}

/**
 * Create user from OAuth profile (internal use)
 * 
 * @param profile - OAuth profile data
 * @param provider - OAuth provider
 * @returns Created user
 */
export async function createUserFromOAuthProfile(
  profile: OAuthProfile,
  provider: OAuthProvider
) {
  try {
    const user = await oauthManager.findOrCreateUser(profile, provider);
    return user;
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      throw error;
    }
    
    throw new BusinessLogicError(
      'Failed to create user from OAuth profile',
      'OAUTH_USER_CREATION_FAILED'
    );
  }
}

/**
 * Create OAuth account for user (internal use)
 * 
 * @param userId - User ID
 * @param provider - OAuth provider
 * @param providerAccountId - Provider account ID
 * @param profile - OAuth profile data
 * @returns Created OAuth account
 */
export async function createOAuthAccountForUser(
  userId: string,
  provider: OAuthProvider,
  providerAccountId: string,
  profile: OAuthProfile
) {
  try {
    const account = await oauthManager.createOAuthAccount(
      userId,
      provider,
      providerAccountId,
      profile
    );
    return account;
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      throw error;
    }
    
    throw new BusinessLogicError(
      'Failed to create OAuth account',
      'OAUTH_ACCOUNT_CREATION_FAILED'
    );
  }
}