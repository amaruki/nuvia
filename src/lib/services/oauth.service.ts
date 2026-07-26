import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { account, user } from "@/db/schema";
import { BusinessLogicError, OAuthConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * OAuth Service for handling OAuth authentication flows
 *
 * This service provides functionality to handle OAuth authentication,
 * including checking for email conflicts with existing accounts.
 */
export class OAuthService {
  /**
   * Check if an email is already registered with email/password credentials
   *
   * @param email - The email to check
   * @returns Promise<boolean> - True if email is registered with password
   */
  static async isEmailRegisteredWithPassword(email: string): Promise<boolean> {
    try {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email),
        columns: { passwordHash: true },
      });

      // If user exists and has a password hash, they registered with email/password
      return !!existingUser && !!existingUser.passwordHash;
    } catch (error) {
      logger.error("Error checking email registration", error);
      throw new BusinessLogicError("Failed to check email registration", "EMAIL_CHECK_FAILED");
    }
  }

  /**
   * Check if an email is already registered with any OAuth provider
   *
   * @param email - The email to check
   * @returns Promise<boolean> - True if email is registered with OAuth
   */
  static async isEmailRegisteredWithOAuth(email: string): Promise<boolean> {
    try {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email),
        with: {
          accounts: {
            where: inArray(account.providerId, ["google", "github", "linkedin"]),
          },
        },
      });

      // If user exists and has OAuth accounts, they registered with OAuth
      return !!existingUser && existingUser.accounts.length > 0;
    } catch (error) {
      logger.error("Error checking OAuth registration", error);
      throw new BusinessLogicError("Failed to check OAuth registration", "OAUTH_CHECK_FAILED");
    }
  }

  /**
   * Get user by email with their authentication methods
   *
   * @param email - The email to lookup
   * @returns Promise<User | null> - User with authentication method info
   */
  static async getUserWithAuthMethods(email: string) {
    try {
      return await db.query.user.findFirst({
        where: eq(user.email, email),
        with: {
          accounts: true,
        },
      });
    } catch (error) {
      logger.error("Error getting user with auth methods", error);
      throw new BusinessLogicError(
        "Failed to get user authentication methods",
        "USER_AUTH_METHODS_FAILED",
      );
    }
  }

  /**
   * Validate OAuth sign-in attempt
   *
   * @param email - The email from OAuth provider
   * @param provider - The OAuth provider
   * @returns Promise<{ isValid: boolean; error?: string }> - Validation result
   */
  static async validateOAuthSignIn(
    email: string,
    provider: string,
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if email is already registered with password
      const isRegisteredWithPassword = await this.isEmailRegisteredWithPassword(email);

      if (isRegisteredWithPassword) {
        throw new OAuthConflictError(
          email,
          "email/password",
          provider,
          `This email is already registered with a password. Please sign in with your password instead of ${provider}.`,
        );
      }

      // Check if email is already registered with a different OAuth provider
      const isRegisteredWithOAuth = await this.isEmailRegisteredWithOAuth(email);

      if (isRegisteredWithOAuth) {
        const user = await this.getUserWithAuthMethods(email);
        const existingProviders = user?.accounts.map((account) => account.providerId) || [];

        // Check if trying to sign in with the same provider (which is fine)
        if (existingProviders.includes(provider)) {
          return { isValid: true };
        }

        throw new OAuthConflictError(
          email,
          existingProviders.join(" or "),
          provider,
          `This email is already registered with ${existingProviders.join(" or ")}. Please sign in using the same provider you used to register.`,
        );
      }

      // Email is not registered, proceed with OAuth sign-up
      return { isValid: true };
    } catch (error) {
      if (error instanceof OAuthConflictError) {
        return {
          isValid: false,
          error: error.message,
        };
      }

      logger.error("Error validating OAuth sign-in", error);
      return {
        isValid: false,
        error: "An error occurred while validating your sign-in attempt. Please try again.",
      };
    }
  }

  /**
   * Link OAuth account to existing user
   *
   * @param userId - The user ID to link the OAuth account to
   * @param provider - The OAuth provider
   * @param accountId - The OAuth account ID
   * @param additionalData - Additional OAuth data
   * @returns Promise<void>
   */
  static async linkOAuthAccount(
    userId: string,
    provider: string,
    accountId: string,
    additionalData?: {
      refreshToken?: string;
      accessToken?: string;
      accessTokenExpiresAt?: Date;
      scope?: string;
      idToken?: string;
    },
  ): Promise<void> {
    try {
      await db.insert(account).values({
        userId,
        providerId: provider,
        accountId,
        ...additionalData,
      });
    } catch (error) {
      logger.error("Error linking OAuth account", error);
      throw new BusinessLogicError("Failed to link OAuth account", "OAUTH_LINK_FAILED");
    }
  }
}
