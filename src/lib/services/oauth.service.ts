import { OAuthProvider, OAuthProfile, SafeUser } from '@/types/auth.types';
import { BusinessLogicError, ValidationError } from '@/lib/errors';
import { oAuthProfileSchema } from '@/lib/validation/auth.validation';
import { validateWithSchema } from '@/lib/utils/validation-utils';
import { auth } from '@/lib/auth';
import { oauthManager } from '@/lib/managers/oauth.manager';
import { loggingService, AuthEventType, AuthEventSeverity } from '@/lib/services/logging.service';
import type { Session } from 'better-auth/types';

/**
 * OAuth Service - Handles OAuth authentication business logic
 *
 * This service is responsible for:
 * - OAuth provider configuration validation
 * - OAuth profile processing and validation
 * - User account linking/creation for OAuth users
 * - OAuth session management
 */
export class OAuthService {
  /**
   * Validate OAuth provider configuration
   *
   * @param provider - OAuth provider to validate
   * @throws {BusinessLogicError} If provider is not supported or not configured
   */
  private validateProvider(provider: OAuthProvider): void {
    const supportedProviders: OAuthProvider[] = ['google', 'github', 'linkedin'];
    
    if (!supportedProviders.includes(provider)) {
      throw new BusinessLogicError(
        `Unsupported OAuth provider: ${provider}`,
        'UNSUPPORTED_OAUTH_PROVIDER'
      );
    }

    // Check if provider is enabled in configuration
    switch (provider) {
      case 'google':
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
          throw new BusinessLogicError(
            'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
            'OAUTH_NOT_CONFIGURED'
          );
        }
        break;
      case 'github':
        if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
          throw new BusinessLogicError(
            'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
            'OAUTH_NOT_CONFIGURED'
          );
        }
        break;
      case 'linkedin':
        if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
          throw new BusinessLogicError(
            'LinkedIn OAuth is not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.',
            'OAUTH_NOT_CONFIGURED'
          );
        }
        break;
    }
  }

  /**
   * Validate and process OAuth profile data
   *
   * @param profile - Raw OAuth profile data
   * @returns Validated OAuth profile
   * @throws {ValidationError} If profile data is invalid
   */
  private validateOAuthProfile(profile: Partial<OAuthProfile>): OAuthProfile {
    try {
      return validateWithSchema(oAuthProfileSchema, profile);
    } catch (error) {
      throw new ValidationError([
        {
          field: 'oauth_profile',
          message: 'Invalid OAuth profile data',
        },
      ]);
    }
  }

  /**
   * Generate username from OAuth profile
   *
   * @param profile - OAuth profile data
   * @returns Generated username
   */
  private generateUsername(profile: OAuthProfile): string {
    // Try to use username from profile if available
    if (profile.username) {
      return profile.username.toLowerCase();
    }

    // Generate from email (remove domain and special characters)
    const emailUsername = profile.email.split('@')[0];
    const cleanUsername = emailUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${cleanUsername}_${randomSuffix}`;
  }

  /**
   * Get OAuth authorization URL
   *
   * @param provider - OAuth provider
   * @param callbackUrl - URL to redirect to after authentication
   * @returns Authorization URL
   */
  async getAuthorizationUrl(provider: OAuthProvider, callbackUrl?: string): Promise<string> {
    this.validateProvider(provider);

    try {
      // Use Better Auth's built-in OAuth endpoints with proper state handling
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';

      // Build the authorization URL using Better Auth's proper endpoint
      const authUrl = new URL(`${baseUrl}/api/auth/signin/${provider}`);

      // Add callback URL as a query parameter if provided
      if (callbackUrl) {
        authUrl.searchParams.set('callbackURL', callbackUrl);
      }

      // Add current URL as fallback callback if none provided
      if (!callbackUrl) {
        authUrl.searchParams.set('callbackURL', `${baseUrl}/auth/callback`);
      }

      const finalUrl = authUrl.toString();

      console.log('OAuth Authorization URL generated:', {
        provider,
        baseUrl,
        authUrl: authUrl.pathname,
        finalUrl,
        hasCallbackUrl: !!callbackUrl,
        searchParams: Object.fromEntries(authUrl.searchParams),
      });

      await loggingService.logAuthEvent({
        eventType: 'OAUTH_AUTHORIZATION_REQUEST' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: `Generated OAuth authorization URL for provider: ${provider}`,
        metadata: {
          provider,
          baseUrl,
          authUrl: authUrl.pathname,
          finalUrl,
          hasCallbackUrl: !!callbackUrl,
          searchParams: Object.fromEntries(authUrl.searchParams),
          action: 'oauth_authorization_url_generated'
        }
      });

      return finalUrl;
    } catch (error) {
      console.error('Failed to generate OAuth authorization URL:', {
        provider,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      await loggingService.logAuthEvent({
        eventType: 'OAUTH_AUTHORIZATION_FAILED' as AuthEventType,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to generate OAuth authorization URL for provider: ${provider}`,
        metadata: {
          provider,
          error: error instanceof Error ? error.message : String(error),
          action: 'oauth_authorization_url_failed'
        }
      });

      throw new BusinessLogicError(
        'Failed to generate OAuth authorization URL',
        'OAUTH_AUTHORIZATION_FAILED'
      );
    }
  }

  /**
   * Handle OAuth callback and process user authentication
   *
   * This method is now handled by better-auth's built-in OAuth routes
   * The actual callback processing happens in /api/auth/[...all]/route.ts
   *
   * @param provider - OAuth provider
   * @param code - Authorization code
   * @param state - OAuth state parameter
   * @returns Authenticated user with session
   */
  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<{ user: SafeUser; session: Session }> {
    this.validateProvider(provider);

    try {
      // This is now handled by better-auth's built-in OAuth routes
      // We just need to validate the parameters and let better-auth handle the rest
      
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_CALLBACK_RECEIVED' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: `OAuth callback received for provider: ${provider}`,
        metadata: {
          provider,
          hasCode: !!code,
          hasState: !!state,
          action: 'oauth_callback_received'
        }
      });
      
      // The actual OAuth callback handling is now done by better-auth
      // This method is kept for backward compatibility and future customization
      
      throw new BusinessLogicError(
        'OAuth callback handling is now managed by better-auth. Use the built-in OAuth routes.',
        'OAUTH_CALLBACK_HANDLED_BY_BETTER_AUTH'
      );
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_CALLBACK_FAILED' as AuthEventType,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to process OAuth callback for provider: ${provider}`,
        metadata: {
          provider,
          error: error instanceof Error ? error.message : String(error),
          action: 'oauth_callback_failed'
        }
      });
      
      throw new BusinessLogicError(
        'Failed to process OAuth callback',
        'OAUTH_CALLBACK_FAILED'
      );
    }
  }

  /**
   * Link OAuth account to existing user
   *
   * @param userId - User ID to link OAuth account to
   * @param provider - OAuth provider
   * @param profile - OAuth profile data
   * @returns Updated user
   */
  async linkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    profile: OAuthProfile
  ): Promise<SafeUser> {
    this.validateProvider(provider);
    const validatedProfile = this.validateOAuthProfile(profile);

    try {
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNT_LINKING_START' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: `Linking OAuth account to user: ${provider}`,
        userId,
        metadata: {
          provider,
          action: 'oauth_account_linking_start'
        }
      });

      // Check if user already has this OAuth provider linked
      const hasExistingAccount = await oauthManager.userHasOAuthAccount(userId, provider);
      
      if (hasExistingAccount) {
        throw new BusinessLogicError(
          `You already have a ${provider} account linked`,
          'OAUTH_ACCOUNT_ALREADY_LINKED'
        );
      }

      // Check if OAuth account is already linked to another user
      const existingAccount = await oauthManager.getOAuthAccount(provider, validatedProfile.providerAccountId);
      
      if (existingAccount && existingAccount.userId !== userId) {
        throw new BusinessLogicError(
          `This ${provider} account is already linked to another user`,
          'OAUTH_ACCOUNT_ALREADY_LINKED_TO_OTHER_USER'
        );
      }

      // Create OAuth account for user
      await oauthManager.createOAuthAccount(
        userId,
        provider,
        validatedProfile.providerAccountId,
        validatedProfile
      );

      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNT_LINKED' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: `OAuth account linked successfully: ${provider}`,
        userId,
        metadata: {
          provider,
          action: 'oauth_account_linked'
        }
      });

      // Return updated user
      return await oauthManager.findOrCreateUser(validatedProfile, provider);
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNT_LINKING_FAILED' as AuthEventType,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to link OAuth account: ${provider}`,
        userId,
        metadata: {
          provider,
          error: error instanceof Error ? error.message : String(error),
          action: 'oauth_account_linking_failed'
        }
      });
      
      throw new BusinessLogicError(
        'Failed to link OAuth account',
        'OAUTH_LINKING_FAILED'
      );
    }
  }

  /**
   * Unlink OAuth account from user
   *
   * @param userId - User ID
   * @param provider - OAuth provider to unlink
   * @returns Updated user
   */
  async unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<SafeUser> {
    this.validateProvider(provider);

    try {
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNT_UNLINKING_START' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: `Unlinking OAuth account from user: ${provider}`,
        userId,
        metadata: {
          provider,
          action: 'oauth_account_unlinking_start'
        }
      });

      // Check if user has this OAuth provider linked
      const hasExistingAccount = await oauthManager.userHasOAuthAccount(userId, provider);
      
      if (!hasExistingAccount) {
        throw new BusinessLogicError(
          `You don't have a ${provider} account linked`,
          'OAUTH_ACCOUNT_NOT_LINKED'
        );
      }

      // Check if user has other authentication methods
      const userAccounts = await oauthManager.getUserOAuthAccounts(userId);
      
      if (userAccounts.length <= 1) {
        throw new BusinessLogicError(
          'You cannot unlink your only authentication method. Please add another authentication method first.',
          'OAUTH_CANNOT_UNLINK_LAST_ACCOUNT'
        );
      }

      // Get OAuth accounts to find the providerAccountId
      const accounts = await oauthManager.getUserOAuthAccounts(userId);
      const accountToUnlink = accounts.find(account => account.provider === provider);
      
      if (!accountToUnlink) {
        throw new BusinessLogicError(
          `OAuth account not found`,
          'OAUTH_ACCOUNT_NOT_FOUND'
        );
      }

      // Delete OAuth account
      await oauthManager.deleteOAuthAccount(userId, provider, accountToUnlink.providerAccountId);

      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNT_UNLINKED' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: `OAuth account unlinked successfully: ${provider}`,
        userId,
        metadata: {
          provider,
          action: 'oauth_account_unlinked'
        }
      });

      // Return user data (we don't modify the user record when unlinking)
      // In a real implementation, we would fetch the user from the database
      return {
        id: userId,
        username: '',
        email: '',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNT_UNLINKING_FAILED' as AuthEventType,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to unlink OAuth account: ${provider}`,
        userId,
        metadata: {
          provider,
          error: error instanceof Error ? error.message : String(error),
          action: 'oauth_account_unlinking_failed'
        }
      });
      
      throw new BusinessLogicError(
        'Failed to unlink OAuth account',
        'OAUTH_UNLINKING_FAILED'
      );
    }
  }

  /**
   * Get user's linked OAuth accounts
   *
   * @param userId - User ID
   * @returns Array of linked OAuth accounts
   */
  async getLinkedAccounts(userId: string): Promise<Array<{
    provider: OAuthProvider;
    providerAccountId: string;
    email?: string;
    name?: string;
    image?: string;
  }>> {
    try {
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNTS_RETRIEVAL_START' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: 'Retrieving OAuth accounts for user',
        userId,
        metadata: {
          action: 'oauth_accounts_retrieval_start'
        }
      });

      const accounts = await oauthManager.getUserOAuthAccounts(userId);
      
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNTS_RETRIEVED' as AuthEventType,
        severity: AuthEventSeverity.INFO,
        message: 'OAuth accounts retrieved successfully',
        userId,
        metadata: {
          accountCount: accounts.length,
          action: 'oauth_accounts_retrieved'
        }
      });

      return accounts.map(account => ({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        email: account.email,
        name: account.name,
        image: account.image,
      }));
    } catch (error) {
      await loggingService.logAuthEvent({
        eventType: 'OAUTH_ACCOUNTS_RETRIEVAL_FAILED' as AuthEventType,
        severity: AuthEventSeverity.ERROR,
        message: 'Failed to retrieve linked accounts',
        userId,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          action: 'oauth_accounts_retrieval_failed'
        }
      });
      
      throw new BusinessLogicError(
        'Failed to retrieve linked accounts',
        'OAUTH_ACCOUNTS_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Check if OAuth provider is configured and enabled
   *
   * @param provider - OAuth provider to check
   * @returns True if provider is configured and enabled
   */
  isProviderConfigured(provider: OAuthProvider): boolean {
    try {
      this.validateProvider(provider);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
