import { prisma } from '@/lib/prisma';
import { OAuthProvider, OAuthProfile, SafeUser } from '@/types/auth.types';
import { BusinessLogicError, NotFoundError } from '@/lib/errors';
import { loggingService, AuthEventType, AuthEventSeverity } from '@/lib/services/logging.service';
import type { User, Account } from '@prisma/client';

/**
 * OAuth Manager - Handles OAuth data access operations
 *
 * This manager is responsible for:
 * - Database operations for OAuth accounts
 * - User account creation/retrieval for OAuth users
 * - OAuth token storage and retrieval
 * - Account linking/unlinking operations
 * - Atomic database transactions for OAuth operations
 */
export class OAuthManager {
  /**
   * Find or create user from OAuth profile with atomic transaction
   *
   * @param profile - OAuth profile data
   * @param provider - OAuth provider
   * @returns Existing or newly created user
   */
  async findOrCreateUser(profile: OAuthProfile, provider: OAuthProvider): Promise<SafeUser> {
    try {
      return await prisma.$transaction(async (tx) => {
        // First, try to find existing user by email
        let user = await tx.user.findUnique({
          where: { email: profile.email },
        });

        if (user) {
          // User exists, return safe user data
          await loggingService.logAuthEvent({
            eventType: AuthEventType.LOGIN_SUCCESS,
            severity: AuthEventSeverity.INFO,
            message: `Found existing user for OAuth profile: ${provider}`,
            userId: user.id,
            metadata: {
              provider,
              email: profile.email,
              action: 'oauth_user_found'
            }
          });
          return this.toSafeUser(user);
        }

        // Create new user from OAuth profile
        const username = await this.generateUniqueUsername(profile.email, profile.username, tx);
        
        user = await tx.user.create({
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

        await loggingService.logAuthEvent({
          eventType: AuthEventType.SIGNUP_SUCCESS,
          severity: AuthEventSeverity.INFO,
          message: `Created new user from OAuth profile: ${provider}`,
          userId: user.id,
          metadata: {
            provider,
            email: profile.email,
            action: 'oauth_user_created'
          }
        });

        return this.toSafeUser(user);
      });
    } catch (error) {
      await loggingService.logAuthEvent({
        eventType: AuthEventType.SIGNUP_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to find or create user from OAuth profile: ${provider}`,
        metadata: {
          provider,
          email: profile.email,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw new BusinessLogicError(
        'Failed to find or create user from OAuth profile',
        'OAUTH_USER_CREATION_FAILED'
      );
    }
  }

  /**
   * Create OAuth account for user with atomic transaction
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
      return await prisma.$transaction(async (tx) => {
        // Check if account already exists
        const existingAccount = await tx.account.findUnique({
          where: {
            providerId_accountId: {
              providerId: provider,
              accountId: providerAccountId,
            },
          },
        });

        if (existingAccount) {
          throw new BusinessLogicError(
            'OAuth account already exists',
            'OAUTH_ACCOUNT_EXISTS'
          );
        }

        // Verify user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new BusinessLogicError(
            'User not found',
            'USER_NOT_FOUND'
          );
        }

        // Create new OAuth account
        const account = await tx.account.create({
          data: {
            userId,
            providerId: provider,
            accountId: providerAccountId,
          },
        });

        await loggingService.logAuthEvent({
          eventType: AuthEventType.LOGIN_SUCCESS,
          severity: AuthEventSeverity.INFO,
          message: `Created OAuth account for user: ${provider}`,
          userId,
          metadata: {
            provider,
            providerAccountId,
            action: 'oauth_account_created'
          }
        });

        return account;
      });
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
      await loggingService.logAuthEvent({
        eventType: AuthEventType.LOGIN_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to create OAuth account: ${provider}`,
        metadata: {
          userId,
          provider,
          providerAccountId,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
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
          providerId_accountId: {
            providerId: provider,
            accountId: providerAccountId,
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
      
      await loggingService.logAuthEvent({
        eventType: AuthEventType.LOGIN_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to retrieve OAuth account: ${provider}`,
        metadata: {
          provider,
          providerAccountId,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
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
          providerId: true,
          accountId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return accounts.map((account) => ({
        id: account.id,
        provider: account.providerId as OAuthProvider,
        providerAccountId: account.accountId,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }));
    } catch (error) {
      await loggingService.logAuthEvent({
        eventType: AuthEventType.LOGIN_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: 'Failed to retrieve user OAuth accounts',
        userId,
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw new BusinessLogicError(
        'Failed to retrieve user OAuth accounts',
        'OAUTH_ACCOUNTS_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Delete OAuth account with atomic transaction
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
      return await prisma.$transaction(async (tx) => {
        // Verify user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new BusinessLogicError(
            'User not found',
            'USER_NOT_FOUND'
          );
        }

        // Verify account exists and belongs to user
        const account = await tx.account.findFirst({
          where: {
            userId,
            providerId: provider,
            accountId: providerAccountId,
          },
        });

        if (!account) {
          throw new BusinessLogicError(
            'OAuth account not found',
            'OAUTH_ACCOUNT_NOT_FOUND'
          );
        }

        // Delete OAuth account
        const result = await tx.account.deleteMany({
          where: {
            userId,
            providerId: provider,
            accountId: providerAccountId,
          },
        });

        await loggingService.logAuthEvent({
          eventType: AuthEventType.PROFILE_UPDATE,
          severity: AuthEventSeverity.INFO,
          message: `Deleted OAuth account for user: ${provider}`,
          userId,
          metadata: {
            provider,
            providerAccountId,
            action: 'oauth_account_deleted'
          }
        });

        return result.count > 0;
      });
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
      await loggingService.logAuthEvent({
        eventType: AuthEventType.LOGIN_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to delete OAuth account: ${provider}`,
        userId,
        metadata: {
          userId,
          provider,
          providerAccountId,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
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
          providerId: provider,
        },
      });

      return !!account;
    } catch (error) {
      await loggingService.logAuthEvent({
        eventType: AuthEventType.LOGIN_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to check OAuth account existence: ${provider}`,
        userId,
        metadata: {
          userId,
          provider,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw new BusinessLogicError(
        'Failed to check OAuth account existence',
        'OAUTH_ACCOUNT_CHECK_FAILED'
      );
    }
  }

  /**
   * Update OAuth tokens with atomic transaction
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
      return await prisma.$transaction(async (tx) => {
        // Verify account exists
        const account = await tx.account.findUnique({
          where: {
            providerId_accountId: {
              providerId: provider,
              accountId: providerAccountId,
            },
          },
        });

        if (!account) {
          throw new BusinessLogicError(
            'OAuth account not found',
            'OAUTH_ACCOUNT_NOT_FOUND'
          );
        }

        // Update OAuth tokens
        const updatedAccount = await tx.account.update({
          where: {
            providerId_accountId: {
              providerId: provider,
              accountId: providerAccountId,
            },
          },
          data: {
            ...(tokens.accessToken && { accessToken: tokens.accessToken }),
            ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
            ...(tokens.expiresAt && { accessTokenExpiresAt: tokens.expiresAt }),
            ...(tokens.idToken && { idToken: tokens.idToken }),
          },
        });

        await loggingService.logAuthEvent({
          eventType: AuthEventType.LOGIN_SUCCESS,
          severity: AuthEventSeverity.INFO,
          message: `Updated OAuth tokens for account: ${provider}`,
          userId: account.userId,
          metadata: {
            provider,
            providerAccountId,
            hasAccessToken: !!tokens.accessToken,
            hasRefreshToken: !!tokens.refreshToken,
            hasExpiresAt: !!tokens.expiresAt,
            hasIdToken: !!tokens.idToken,
            action: 'oauth_tokens_updated'
          }
        });

        return updatedAccount;
      });
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      
      await loggingService.logAuthEvent({
        eventType: AuthEventType.LOGIN_FAILURE,
        severity: AuthEventSeverity.ERROR,
        message: `Failed to update OAuth tokens: ${provider}`,
        metadata: {
          provider,
          providerAccountId,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw new BusinessLogicError(
        'Failed to update OAuth tokens',
        'OAUTH_TOKEN_UPDATE_FAILED'
      );
    }
  }

  /**
   * Generate unique username from OAuth profile
   *
   * @param email - User email
   * @param preferredUsername - Preferred username from profile
   * @param tx - Prisma transaction client
   * @returns Generated unique username
   */
  private async generateUniqueUsername(
    email: string,
    preferredUsername: string | undefined,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<string> {
    // Try to use preferred username if available
    if (preferredUsername) {
      const baseUsername = preferredUsername.toLowerCase();
      let username = baseUsername;
      let counter = 1;
      
      // Check if username exists, append number if needed
      while (await tx.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
        
        // Prevent infinite loop
        if (counter > 100) {
          throw new BusinessLogicError(
            'Failed to generate unique username',
            'USERNAME_GENERATION_FAILED'
          );
        }
      }
      
      return username;
    }

    // Generate from email (remove domain and special characters)
    const emailUsername = email.split('@')[0];
    const cleanUsername = emailUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // If clean username is empty, use a default
    const baseUsername = cleanUsername || 'user';
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists, append number if needed
    while (await tx.user.findUnique({ where: { username } })) {
      username = `${baseUsername}_${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 100) {
        throw new BusinessLogicError(
          'Failed to generate unique username',
          'USERNAME_GENERATION_FAILED'
        );
      }
    }
    
    return username;
  }

  /**
   * Convert User to SafeUser (remove sensitive data)
   *
   * @param user - User object from database
   * @returns SafeUser object
   */
  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName || undefined,
      profilePhoto: user.profilePhoto || undefined,
      bio: user.bio || undefined,
      externalLinks: user.externalLinks as Record<string, string> | undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt || undefined,
    };
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager();