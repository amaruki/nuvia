import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

/**
 * OAuth utility functions for client-side usage
 */
export const oauthUtils = {
  /**
   * Sign in with OAuth provider
   * @param provider - OAuth provider (google, github, etc.)
   * @param callbackURL - URL to redirect to after successful authentication
   */
  async signInWithProvider(provider: string, callbackURL?: string) {
    return await authClient.signIn.social({
      provider: provider as any,
      callbackURL: callbackURL || "/",
    });
  },

  /**
   * Link OAuth account to current user
   * @param provider - OAuth provider
   */
  async linkOAuthAccount(provider: string) {
    return await authClient.linkSocial({
      provider: provider as any,
    });
  },

  /**
   * Unlink OAuth account from current user
   * @param provider - OAuth provider
   */
  async unlinkOAuthAccount(provider: string) {
    return await authClient.unlinkAccount({
      providerId: provider as any,
    });
  },
};