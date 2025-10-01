import { OAuthProvider, OAuthProfile, SafeUser } from '@/types/auth.types';
import { BusinessLogicError, ValidationError } from '@/lib/errors';
import { oAuthProfileSchema } from '@/lib/validation/auth.validation';
import { validateWithSchema } from '@/lib/utils/validation-utils';

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
    if (provider === 'google' && !process.env.GOOGLE_CLIENT_ID) {
      throw new BusinessLogicError(
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        'OAUTH_NOT_CONFIGURED'
      );
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
      // For now, return a placeholder URL
      // In a real implementation, this would use better-auth's OAuth functionality
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const authCallbackUrl = callbackUrl || `${baseUrl}/api/auth/callback/${provider}`;
      
      // This is a simplified implementation
      // In production, you would use better-auth's built-in OAuth methods
      return `${baseUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(authCallbackUrl)}`;
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to generate OAuth authorization URL',
        'OAUTH_AUTHORIZATION_FAILED'
      );
    }
  }

  /**
   * Handle OAuth callback and process user authentication
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
  ): Promise<{ user: SafeUser; session: any }> {
    this.validateProvider(provider);

    try {
      // This is a placeholder implementation
      // In production, this would use better-auth's built-in OAuth callback handling
      
      // For now, throw an error indicating this needs to be implemented
      throw new BusinessLogicError(
        'OAuth callback handling not yet implemented. Please use the better-auth built-in OAuth routes.',
        'OAUTH_NOT_IMPLEMENTED'
      );
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
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
      // This is a placeholder implementation
      // In production, this would use better-auth's built-in account linking
      
      throw new BusinessLogicError(
        'OAuth account linking not yet implemented. Please use the better-auth built-in OAuth functionality.',
        'OAUTH_NOT_IMPLEMENTED'
      );
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
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
      // This is a placeholder implementation
      // In production, this would use better-auth's built-in account unlinking
      
      throw new BusinessLogicError(
        'OAuth account unlinking not yet implemented. Please use the better-auth built-in OAuth functionality.',
        'OAUTH_NOT_IMPLEMENTED'
      );
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
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
      // This is a placeholder implementation
      // In production, this would use better-auth's built-in account listing
      
      throw new BusinessLogicError(
        'OAuth account retrieval not yet implemented. Please use the better-auth built-in OAuth functionality.',
        'OAUTH_NOT_IMPLEMENTED'
      );
    } catch (error) {
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