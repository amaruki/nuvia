"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clientSafeAuthMessage } from "@/lib/auth/common";
import { recordLoginAttempt, resolveLoginIdentifier } from "@/lib/auth/login-activity";
import { checkRouteRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { loginSchema, signupSchema } from "@/lib/validation/auth.validation";
import type { AuthResponse } from "@/types/auth.types";

import { transformUserToSafeUser } from "./mappers";

/**
 * Server action for user login
 */
export async function loginAction(formData: FormData): Promise<AuthResponse> {
  try {
    const requestHeaders = await headers();
    const limit = await checkRouteRateLimit(requestHeaders, "login");
    if (limit.limited) return { success: false, message: rateLimitMessage(limit) };

    // Extract form data
    const emailOrUsername = formData.get("emailOrUsername") as string;
    const password = formData.get("password") as string;

    // Validate input
    const validatedData = loginSchema.parse({ emailOrUsername, password });

    // The field accepts a username too, but signInEmail only understands
    // emails — resolve it first. Without this, username sign-in silently
    // failed for every user.
    const email = await resolveLoginIdentifier(validatedData.emailOrUsername);
    try {
      // Use Better Auth API for sign in
      const result = await auth.api.signInEmail({
        body: {
          email: email,
          password: validatedData.password,
        },
      });

      await recordLoginAttempt({
        emailOrUsername: email,
        successful: true,
        headers: requestHeaders,
      });

      // Better Auth returns session/user object or throws errors
      return {
        success: true,
        message: "Login successful",
        data: {
          user: transformUserToSafeUser(result.user),
        },
      };
    } catch (signInError) {
      await recordLoginAttempt({
        emailOrUsername: email,
        successful: false,
        headers: requestHeaders,
      });

      throw signInError;
    }
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Login failed"),
    };
  }
}

/**
 * Server action for user registration
 */
export async function signupAction(formData: FormData): Promise<AuthResponse> {
  try {
    const requestHeaders = await headers();
    const limit = await checkRouteRateLimit(requestHeaders, "signup");
    if (limit.limited) return { success: false, message: rateLimitMessage(limit) };

    // Extract form data - handle both regular and numbered field names
    const email = (formData.get("email") || formData.get("1_email")) as string;
    const username = (formData.get("username") || formData.get("1_username")) as string;
    const fullName = (formData.get("fullName") || formData.get("1_fullName")) as string;
    const password = (formData.get("password") || formData.get("1_password")) as string;
    const confirmPassword = (formData.get("confirmPassword") ||
      formData.get("1_confirmPassword")) as string;
    const agreeToTermsValue = (formData.get("agreeToTerms") ||
      formData.get("1_agreeToTerms")) as string;

    // Convert agreeToTerms to boolean
    const agreeToTerms = agreeToTermsValue === "true";

    // Validate input
    const validatedData = signupSchema.parse({
      email,
      username,
      fullName,
      password,
      confirmPassword,
      agreeToTerms,
    });

    // Use Better Auth API for sign up
    const result = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.fullName,
        username: validatedData.username,
      },
    });

    // Better Auth returns either user object or throws errors
    return {
      success: true,
      message: "Signup successful",
      data: {
        user: transformUserToSafeUser(result.user),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Signup failed"),
    };
  }
}
