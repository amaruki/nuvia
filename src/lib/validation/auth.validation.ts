import { z } from "zod";
import type { ExternalLink } from "@/types/auth.types";

// External link validation schema
const externalLinkSchema: z.ZodType<ExternalLink> = z.object({
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(50, "Platform must be less than 50 characters"),
  url: z.url("Please enter a valid URL"),
  username: z.string().optional(),
});

// Login validation schema
export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Signup validation schema
export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    email: z.email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

// Reset password validation schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Update profile validation schema
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  externalLinks: z
    .array(externalLinkSchema)
    .max(10, "You can add up to 10 external links")
    .optional(),
});

// Change password validation schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Device info validation schema
export const deviceInfoSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z
    .string()
    .min(1, "Device name is required")
    .max(100, "Device name must be less than 100 characters"),
  deviceType: z
    .string()
    .min(1, "Device type is required")
    .max(50, "Device type must be less than 50 characters"),
  ipAddress: z.string().min(1, "IP address is required"),
  userAgent: z.string().min(1, "User agent is required"),
});

// Login activity info validation schema
export const loginActivityInfoSchema = z.object({
  ipAddress: z.string().min(1, "IP address is required"),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
  location: z.string().optional(),
  successful: z.boolean(),
});

// OAuth profile validation schema
export const oAuthProfileSchema = z.object({
  provider: z.enum(["google", "github", "linkedin"]),
  providerAccountId: z.string().min(1, "Provider account ID is required"),
  email: z.email("Please enter a valid email address"),
  name: z.string().optional(),
  image: z.url("Please enter a valid image URL").optional(),
  username: z.string().optional(),
});

// Export inferred types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type DeviceInfoFormData = z.infer<typeof deviceInfoSchema>;
export type LoginActivityInfoFormData = z.infer<typeof loginActivityInfoSchema>;
export type OAuthProfileFormData = z.infer<typeof oAuthProfileSchema>;
