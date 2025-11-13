'use server';

import { AuthUtils } from '@/lib/auth/utils';
import { AuthError, AuthErrorType } from '@/lib/auth/common';
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation/auth.validation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type {
  AuthResponse,
  PasswordResetResponse,
  SafeUser
} from '@/types/auth.types';

// TODO: Implement proper Better Auth API calls once the correct API surface is identified
// TODO: Add proper session management functions
// TODO: Add comprehensive error handling for edge cases

/**
 * Transform better-auth user to SafeUser
 */
function transformUserToSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    username: user.username || user.name || '',
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.name,
    profilePhoto: user.image,
    bio: user.bio,
    externalLinks: user.externalLinks,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: undefined,
  };
}

/**
 * Server action for user login
 */
export async function loginAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const emailOrUsername = formData.get('emailOrUsername') as string;
    const password = formData.get('password') as string;

    // Validate input
    const validatedData = loginSchema.parse({ emailOrUsername, password });

    // Use Better Auth API for sign in
    const result = await auth.api.signInEmail({
      body: {
        email: validatedData.emailOrUsername,
        password: validatedData.password
      }
    });

    // Better Auth returns session/user object or throws errors
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: transformUserToSafeUser(result.user),
        session: {
          accessToken: result.token,
          refreshToken: result.token, // Better Auth might use the same token
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    };
  }
}

/**
 * Server action for user registration
 */
export async function signupAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data - handle both regular and numbered field names
    const email = (formData.get('email') || formData.get('1_email')) as string;
    const username = (formData.get('username') || formData.get('1_username')) as string;
    const fullName = (formData.get('fullName') || formData.get('1_fullName')) as string;
    const password = (formData.get('password') || formData.get('1_password')) as string;
    const confirmPassword = (formData.get('confirmPassword') || formData.get('1_confirmPassword')) as string;
    const agreeToTermsValue = (formData.get('agreeToTerms') || formData.get('1_agreeToTerms')) as string;

    // Convert agreeToTerms to boolean
    const agreeToTerms = agreeToTermsValue === 'true' || agreeToTermsValue === true;

    // Validate input
    const validatedData = signupSchema.parse({
      email,
      username,
      fullName,
      password,
      confirmPassword,
      agreeToTerms
    });

    // Use Better Auth API for sign up
    const result = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.fullName,
        username: validatedData.username
      }
    });

    // Better Auth returns either user object or throws errors
    return {
      success: true,
      message: 'Signup successful',
      data: {
        user: transformUserToSafeUser(result.user)
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Signup failed'
    };
  }
}

/**
 * Server action for password reset request
 */
export async function forgotPasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const email = formData.get('email') as string;

    // Validate input
    const validatedData = forgotPasswordSchema.parse({ email });

    // Use Better Auth API for forgot password
    await auth.api.forgetPassword({
      body: {
        email: validatedData.email,
        redirectTo: '/auth/reset-password'
      }
    });

    return {
      success: true,
      message: 'Password reset email sent if account exists'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed'
    };
  }
}

/**
 * Server action for password reset
 */
export async function resetPasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input
    const validatedData = resetPasswordSchema.parse({
      token,
      password,
      confirmPassword
    });

    // Use Better Auth API for password reset
    await auth.api.resetPassword({
      body: {
        token: validatedData.token,
        newPassword: validatedData.password
      }
    });

    return {
      success: true,
      message: 'Password reset successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed'
    };
  }
}

/**
 * Server action to get current user
 */
export async function getCurrentUserAction(): Promise<{ success: boolean; data?: SafeUser; error?: string }> {
  try {
    const user = await AuthUtils.getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    return {
      success: true,
      data: transformUserToSafeUser(user)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current user'
    };
  }
}

/**
 * Server action to update user profile
 */
export async function updateProfileAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const displayName = formData.get('displayName') as string;
    const bio = formData.get('bio') as string;
    const profilePhoto = formData.get('profilePhoto') as string;
    const externalLinksStr = formData.get('externalLinks') as string;

    // Parse externalLinks if provided
    let externalLinks;
    if (externalLinksStr) {
      try {
        externalLinks = JSON.parse(externalLinksStr);
      } catch (parseError) {
        console.warn('Failed to parse externalLinks:', parseError);
        externalLinks = null;
      }
    }

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Prepare update body
    const updateBody: any = {
      name: displayName || undefined,
      bio: bio || undefined,
      image: profilePhoto || undefined
    };

    // Only include externalLinks if it was provided
    if (externalLinks !== undefined) {
      updateBody.externalLinks = externalLinks;
    }

    // Use Better Auth API for profile update
    const updatedUser = await auth.api.updateUser({
      body: updateBody,
      headers: requestHeaders
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: transformUserToSafeUser(updatedUser)
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Profile update failed'
    };
  }
}

/**
 * Server action to change password
 */
export async function changePasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: 'New passwords do not match'
      };
    }

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API for password change
    await auth.api.changePassword({
      body: {
        currentPassword: currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: true
      },
      headers: requestHeaders
    });

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Password change failed'
    };
  }
}

/**
 * Server action to get user sessions
 */
export async function getUserSessionsAction(): Promise<any> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to list sessions
    const sessions = await auth.api.listSessions({
      headers: requestHeaders
    });

    return {
      success: true,
      data: sessions
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get sessions'
    };
  }
}

/**
 * Server action to revoke a specific session
 */
export async function revokeSessionAction(sessionId: string): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to revoke session
    await auth.api.revokeSession({
      body: {
        token: sessionId
      },
      headers: requestHeaders
    });

    return {
      success: true,
      message: 'Session revoked successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to revoke session'
    };
  }
}

/**
 * Server action to revoke all other sessions
 */
export async function revokeOtherSessionsAction(): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to revoke other sessions
    await auth.api.revokeOtherSessions({
      headers: requestHeaders
    });

    return {
      success: true,
      message: 'Other sessions revoked successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to revoke other sessions'
    };
  }
}

/**
 * Server action to revoke all sessions except current one (for session manager)
 */
export async function revokeAllOtherSessionsAction(): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to revoke other sessions
    await auth.api.revokeOtherSessions({
      headers: requestHeaders
    });

    return {
      success: true,
      message: 'All other sessions revoked successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to revoke other sessions'
    };
  }
}

/**
 * Server action to sign out
 */
export async function signOutAction(): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API for sign out
    await auth.api.signOut({
      headers: requestHeaders
    });

    return {
      success: true,
      message: 'Signed out successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sign out failed'
    };
  }
}

/**
 * Server action to delete user account
 */
export async function deleteAccountAction(): Promise<PasswordResetResponse> {
  try {
    console.log('Account deletion attempt');

    return {
      success: true,
      message: 'Account deletion functionality is being refactored. Please check back soon.'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Account deletion failed'
    };
  }
}

// Export logoutAction for backward compatibility
export const logoutAction = signOutAction;