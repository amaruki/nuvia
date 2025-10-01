import { prisma } from '@/lib/prisma';
import { OAuthProvider, OAuthProfile, SafeUser } from '@/types/auth.types';
import { BusinessLogicError, NotFoundError } from '@/lib/errors';

/**
 * OAuth Manager - Handles OAuth data access operations
 * 
 * This manager is responsible for:
 * - Database operations for OAuth accounts
 * - User account creation/retrieval for OAuth users
 * - OAuth token storage and retrieval
 * - Account linking/unlinking operations
 */
export class OAuthManager {
  /**
   * Find or create user from OAuth profile
   * 
   * @param profile - OAuth profile data
   * @param provider - OAuth provider
   * @returns Existing or newly created user
   */
  async findOrCreateUser(profile: OAuthProfile, provider: OAuthProvider): Promise<SafeUser> {
    try {
      // First, try to find existing user by email
      let user = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // User exists, return safe user data
        return this.toSafeUser(user);
      }

      // Create new user from OAuth profile
      const username = this.generateUsername(profile);
      
      user = await prisma.user.create({
        data: {
          username,
          email: profile.email,
          emailVerified: true, // OAuth providers typically verify emails
          displayName: profile.name || username,
          profilePhoto: profile.image,
          name: profile.name || username,
          image: profile.image,
        },
      });

      return this.toSafeUser(user);
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to find or create user from OAuth profile',
        'OAUTH_USER_CREATION_FAILED'
      );
    }
  }

  /**
   * Create OAuth account for user
   * 
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @param profile - OAuth profile data
   * @returns Created OAuth account
   */
  async createOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
    profile: OAuthProfile
  ) {
    try {
      // Check if account already exists
      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });

      if (existingAccount) {
        throw new BusinessLogicError(
          'OAuth account already exists',
          'OAUTH_ACCOUNT_EXISTS'
        );
      }

      // Create new OAuth account
      const account = await prisma.account.create({
        data: {
          userId,
          provider,
          providerAccountId,
          type: 'oauth',
          name: profile.name,
          email: profile.email,
          image: profile.image,
        },
      });

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

  /**
   * Get OAuth account by provider and account ID
   * 
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @returns OAuth account with user data
   */
  async getOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ) {
    try {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: {
          user: true,
        },
      });

      if (!account) {
        throw new NotFoundError('OAuth account', `${provider}:${providerAccountId}`);
      }

      return {
        ...account,
        user: this.toSafeUser(account.user),
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new BusinessLogicError(
        'Failed to retrieve OAuth account',
        'OAUTH_ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Get user's OAuth accounts
   * 
   * @param userId - User ID
   * @returns Array of OAuth accounts
   */
  async getUserOAuthAccounts(userId: string): Promise<Array<{
    id: string;
    provider: OAuthProvider;
    providerAccountId: string;
    email?: string;
    name?: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          providerAccountId: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return accounts.map((account: any) => ({
        ...account,
        provider: account.provider as OAuthProvider,
      }));
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to retrieve user OAuth accounts',
        'OAUTH_ACCOUNTS_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Delete OAuth account
   * 
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @returns True if deletion was successful
   */
  async deleteOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<boolean> {
    try {
      const result = await prisma.account.deleteMany({
        where: {
          userId,
          provider,
          providerAccountId,
        },
      });

      return result.count > 0;
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to delete OAuth account',
        'OAUTH_ACCOUNT_DELETION_FAILED'
      );
    }
  }

  /**
   * Check if user has OAuth account with specific provider
   * 
   * @param userId - User ID
   * @param provider - OAuth provider
   * @returns True if user has OAuth account with provider
   */
  async userHasOAuthAccount(userId: string, provider: OAuthProvider): Promise<boolean> {
    try {
      const account = await prisma.account.findFirst({
        where: {
          userId,
          provider,
        },
      });

      return !!account;
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to check OAuth account existence',
        'OAUTH_ACCOUNT_CHECK_FAILED'
      );
    }
  }

  /**
   * Update OAuth account tokens
   * 
   * @param providerAccountId - Provider account ID
   * @param provider - OAuth provider
   * @param tokens - OAuth tokens to update
   * @returns Updated OAuth account
   */
  async updateOAuthTokens(
    providerAccountId: string,
    provider: OAuthProvider,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
      idToken?: string;
    }
  ) {
    try {
      const account = await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        data: {
          ...(tokens.accessToken && { access_token: tokens.accessToken }),
          ...(tokens.refreshToken && { refresh_token: tokens.refreshToken }),
          ...(tokens.expiresAt && { expires_at: Math.floor(tokens.expiresAt.getTime() / 1000) }),
          ...(tokens.idToken && { id_token: tokens.idToken }),
        },
      });

      return account;
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to update OAuth tokens',
        'OAUTH_TOKEN_UPDATE_FAILED'
      );
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
   * Convert User to SafeUser (remove sensitive data)
   * 
   * @param user - User object from database
   * @returns SafeUser object
   */
  private toSafeUser(user: any): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      externalLinks: user.externalLinks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager();