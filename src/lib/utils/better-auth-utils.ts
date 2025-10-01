import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { OAuthProvider } from '@/types/auth.types';

/**
 * Sign up a new user with email and password
 * @param username - User's username
 * @param email - User's email
 * @param password - User's password
 * @param displayName - User's display name (optional)
 * @returns Promise with the result of the sign up operation
 */
export async function signUp(
  username: string,
  email: string,
  password: string,
  displayName?: string
) {
  return await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: displayName || username,
      username,
    },
  });
}

/**
 * Sign in a user with email and password
 * @param email - User's email
 * @param password - User's password
 * @returns Promise with the result of the sign in operation
 */
export async function signIn(email: string, password: string) {
  return await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });
}

/**
 * Sign out the current user
 * @returns Promise with the result of the sign out operation
 */
export async function signOut() {
  return await auth.api.signOut({
    headers: await headers(),
  });
}

/**
 * Get the current session
 * @returns Promise with the current session or null if not authenticated
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Get the current user
 * @returns Promise with the current user or null if not authenticated
 */
export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Update user profile
 * @param data - User profile data to update
 * @returns Promise with the result of the update operation
 */
export async function updateProfile(data: {
  displayName?: string;
  bio?: string;
  profilePhoto?: string;
  externalLinks?: Record<string, string>;
}) {
  
  const { displayName, bio, profilePhoto, externalLinks } = data;
  return await auth.api.updateUser({
    body: {
      ...(displayName && { name: displayName }),
      ...(bio && { bio }),
      ...(profilePhoto && { image: profilePhoto }),
      // externalLinks is not supported by better-auth
    },
    headers: await headers(),
  });
}

/**
 * Change user password
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Promise with the result of the password change operation
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  return await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
    },
    headers: await headers(),
  });
}

/**
 * Request a password reset email
 * @param email - User's email
 * @returns Promise with the result of the password reset request
 */
export async function forgotPassword(email: string) {
  return await auth.api.forgetPassword({
    body: {
      email,
      redirectTo: '/auth/reset-password',
    },
  });
}

/**
 * Reset password with a token
 * @param token - Password reset token
 * @param newPassword - New password
 * @returns Promise with the result of the password reset operation
 */
export async function resetPassword(token: string, newPassword: string) {
  return await auth.api.resetPassword({
    body: {
      token,
      newPassword,
    },
  });
}

/**
 * Get user sessions (active devices)
 * @returns Promise with the list of user sessions
 */
export async function getUserSessions() {
  return await auth.api.listSessions({
    headers: await headers(),
  });
}

/**
 * Revoke a specific session
 * @param token - Token of the session to revoke
 * @returns Promise with the result of the revoke operation
 */
export async function revokeSession(token: string) {
  return await auth.api.revokeSession({
    body: {
      token,
    },
    headers: await headers(),
  });
}

/**
 * Revoke all other sessions except the current one
 * @returns Promise with the result of the revoke operation
 */
export async function revokeOtherSessions() {
  return await auth.api.revokeOtherSessions({
    headers: await headers(),
  });
}

/**
 * OAuth utility functions using better-auth
 */

/**
 * Sign in with OAuth provider
 * @param provider - OAuth provider (google, github, etc.)
 * @param callbackURL - URL to redirect to after successful authentication
 * @returns Promise with the OAuth sign-in result
 */
export async function signInWithOAuth(provider: string, callbackURL?: string) {
  return await auth.api.signInSocial({
    body: {
      provider: provider as OAuthProvider,
      callbackURL: callbackURL || "/dashboard",
    },
  });
}

/**
 * Link OAuth account to current user
 * @param provider - OAuth provider
 * @returns Promise with the link result
 */
export async function linkOAuthAccount(provider: string) {
  return await auth.api.linkSocialAccount({
    body: {
      provider: provider as OAuthProvider,
    },
    headers: await headers(),
  });
}

/**
 * Unlink OAuth account from current user
 * @param provider - OAuth provider
 * @returns Promise with the unlink result
 */
export async function unlinkOAuthAccount(provider: string, accountId: string) {
  return await auth.api.unlinkAccount({
    body: {
      providerId: provider as OAuthProvider,
      accountId: accountId,
    },
    headers: await headers(),
  });
}