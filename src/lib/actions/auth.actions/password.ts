"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clientSafeAuthMessage } from "@/lib/auth/common";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth.validation";
import type { PasswordResetResponse } from "@/types/auth.types";

/**
 * Server action for password reset request
 */
export async function forgotPasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const email = formData.get("email") as string;

    // Validate input
    const validatedData = forgotPasswordSchema.parse({ email });

    // Use Better Auth API for forgot password
    // (renamed from forgetPassword -> requestPasswordReset in better-auth 1.5)
    await auth.api.requestPasswordReset({
      body: {
        email: validatedData.email,
        redirectTo: "/auth/reset-password",
      },
    });

    return {
      success: true,
      message: "Password reset email sent if account exists",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Password reset failed"),
    };
  }
}

/**
 * Server action for password reset
 */
export async function resetPasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate input
    const validatedData = resetPasswordSchema.parse({
      token,
      password,
      confirmPassword,
    });

    // Use Better Auth API for password reset
    await auth.api.resetPassword({
      body: {
        token: validatedData.token,
        newPassword: validatedData.password,
      },
    });

    return {
      success: true,
      message: "Password reset successful",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Password reset failed"),
    };
  }
}

/**
 * Server action to change password
 */
export async function changePasswordAction(formData: FormData): Promise<PasswordResetResponse> {
  try {
    // Extract form data
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "New passwords do not match",
      };
    }

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API for password change
    await auth.api.changePassword({
      body: {
        currentPassword: currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: true,
      },
      headers: requestHeaders,
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Password change failed"),
    };
  }
}
