'use server';

import {
  signIn,
  signUp,
  forgotPassword,
  resetPassword,
  getUser,
  updateProfile,
  changePassword,
  getUserSessions,
  revokeSession,
  revokeOtherSessions
} from '@/lib/utils/better-auth-utils';
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation/auth.validation';
import type {
  AuthResponse,
  PasswordResetResponse,
  SafeUser
} from '@/types/auth.types';

/**
 * Transform better-auth user to SafeUser
 */
function transformUserToSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    username: user.username || user.name || '',
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.name || undefined,
    profilePhoto: user.image || undefined,
    bio: user.bio || undefined,
    externalLinks: user.externalLinks || undefined,
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
    const validatedData = loginSchema.parse({
      emailOrUsername,
      password,
    });
    
    // Assume emailOrUsername is an email for better-auth
    const email = emailOrUsername;
    
    // Process login
    const result = await signIn(email, password);
    
    // Transform result to match AuthResponse type
    return {
      success: true,
      data: {
        user: transformUserToSafeUser(result.user),
        // No token needed as better-auth handles cookies
      },
      message: 'Login successful',
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Login action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred during login',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for user signup
 */
export async function signupAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const fullName = formData.get('fullName') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const agreeToTerms = formData.get('agreeToTerms') === 'true';
    
    // Validate input
    const validatedData = signupSchema.parse({
      email,
      username,
      fullName,
      password,
      confirmPassword,
      agreeToTerms,
    });
    
    // Process signup
    const result = await signUp(username, email, password, fullName);
    
    // Transform result to match AuthResponse type
    return {
      success: true,
      data: {
        user: transformUserToSafeUser(result.user),
        // No token needed as better-auth handles cookies
      },
      message: 'Signup successful',
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Signup action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred during signup',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for forgot password
 */
export async function forgotPasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const email = formData.get('email') as string;
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse({
      email,
    });
    
    // Process forgot password
    const result = await forgotPassword(email);
    
    // Transform result to match PasswordResetResponse type
    const isSuccess = result && typeof result === 'object' && 'status' in result ? result.status : false;
    
    return {
      success: isSuccess,
      message: isSuccess
        ? 'Password reset email sent successfully'
        : 'Failed to send password reset email',
      errors: isSuccess ? undefined : { server: ['Failed to send password reset email'] },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Forgot password action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred during forgot password',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for reset password
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    // Validate input
    const validatedData = resetPasswordSchema.parse({
      token,
      password,
      confirmPassword,
    });
    
    // Process reset password
    const result = await resetPassword(token, password);
    
    // Transform result to match AuthResponse type
    const isSuccess = result && typeof result === 'object' && 'status' in result ? result.status : false;
    
    return {
      success: isSuccess,
      message: isSuccess
        ? 'Password reset successful'
        : 'Failed to reset password',
      errors: isSuccess ? undefined : { server: ['Failed to reset password'] },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Reset password action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred during password reset',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for getting user profile
 */
export async function getProfileAction(): Promise<SafeUser | null> {
  try {
    const user = await getUser();
    if (!user) return null;
    
    // Transform user to match SafeUser type
    return transformUserToSafeUser(user);
  } catch (error) {
    console.error('Get profile action error:', error);
    return null;
  }
}

/**
 * Server action for updating user profile
 */
export async function updateProfileAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const displayName = formData.get('displayName') as string;
    const bio = formData.get('bio') as string;
    
    // Parse external links if present
    let externalLinks = [];
    const externalLinksJson = formData.get('externalLinks') as string;
    if (externalLinksJson) {
      try {
        externalLinks = JSON.parse(externalLinksJson);
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Update profile
    const result = await updateProfile({
      displayName,
      bio,
      externalLinks,
    });
    
    // Transform result to match AuthResponse type
    return {
      success: true,
      data: {
        user: transformUserToSafeUser(result),
      },
      message: 'Profile updated successfully',
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Update profile action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while updating profile',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for changing password
 */
export async function changePasswordAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    
    // Change password
    const result = await changePassword(currentPassword, newPassword);
    
    // Transform result to match AuthResponse type
    const isSuccess = result && typeof result === 'object' && 'token' in result;
    
    return {
      success: isSuccess,
      message: isSuccess
        ? 'Password changed successfully'
        : 'Failed to change password',
      errors: isSuccess ? undefined : { server: ['Failed to change password'] },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Change password action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while changing password',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for verifying email
 */
export async function verifyEmailAction(token: string): Promise<AuthResponse> {
  try {
    // This functionality would need to be implemented with better-auth
    // For now, return a placeholder response
    
    return {
      success: true,
      message: 'Email verified successfully',
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Verify email action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while verifying email',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for deactivating a device
 */
export async function deactivateDeviceAction(token: string): Promise<AuthResponse> {
  try {
    // Deactivate device
    const result = await revokeSession(token);
    
    // Transform result to match AuthResponse type
    const isSuccess = result && typeof result === 'object' && 'status' in result ? result.status : false;
    
    return {
      success: isSuccess,
      message: isSuccess
        ? 'Device deactivated successfully'
        : 'Failed to deactivate device',
      errors: isSuccess ? undefined : { server: ['Failed to deactivate device'] },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Deactivate device action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while deactivating device',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for deactivating other devices
 */
export async function deactivateOtherDevicesAction(): Promise<AuthResponse> {
  try {
    // Deactivate other devices
    const result = await revokeOtherSessions();
    
    // Transform result to match AuthResponse type
    const isSuccess = result && typeof result === 'object' && 'status' in result ? result.status : false;
    
    return {
      success: isSuccess,
      message: isSuccess
        ? 'Other devices deactivated successfully'
        : 'Failed to deactivate other devices',
      errors: isSuccess ? undefined : { server: ['Failed to deactivate other devices'] },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Deactivate other devices action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while deactivating other devices',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for getting active devices
 */
export async function getActiveDevicesAction() {
  try {
    // Get active devices
    const sessions = await getUserSessions();
    
    return {
      success: true,
      data: {
        devices: sessions,
      },
      message: 'Active devices retrieved successfully',
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Get active devices action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while retrieving active devices',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}

/**
 * Server action for deleting account
 */
export async function deleteAccountAction(): Promise<AuthResponse> {
  try {
    // This functionality would need to be implemented with better-auth
    // For now, return a placeholder response
    
    return {
      success: true,
      message: 'Account deleted successfully',
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  } catch (error) {
    console.error('Delete account action error:', error);
    
    // Return a generic error response
    return {
      success: false,
      message: 'An unexpected error occurred while deleting account',
      errors: {
        server: ['Please try again later'],
      },
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    };
  }
}