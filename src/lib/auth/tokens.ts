/**
 * Token seam: lifecycle of short-lived auth tokens — password-reset tokens
 * and email-verification tokens — including their delivery via email.
 *
 * Split out of the old monolithic src/lib/auth.ts.
 */

import type { BetterAuthOptions } from "better-auth";
import { logger } from "@/lib/logger";
import { validatePasswordStrength } from "@/lib/utils/password";
import { emailService, emailTemplates } from "./email";

// Email and password authentication
export const emailAndPasswordOptions = {
  enabled: true,
  autoSignIn: true,
  passwordValidation: (password: string) => {
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }
    return true;
  },
  sendResetPassword: async ({ user, url }) => {
    const template = await emailTemplates.passwordReset(url, user.name || user.email);
    const result = await emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (!result.success) {
      logger.error("Failed to send password reset email", result.error);
      throw new Error("Failed to send password reset email");
    }
  },
  onPasswordReset: async ({ user }: { user: { email: string } }) => {
    logger.info(`Password for user ${user.email} has been reset.`);
  },
  resetPasswordTokenExpiresIn: 3600, // 1 hour
} satisfies BetterAuthOptions["emailAndPassword"] & {
  // Not part of better-auth's public emailAndPassword options (and unread
  // by its runtime — password policy there comes from min/max length);
  // carried verbatim from the original inline config for parity.
  passwordValidation?: (password: string) => boolean;
};

// Email verification configuration. Key name matters: better-auth reads
// sendVerificationEmail/expiresIn from `emailVerification`, not from the
// `verification` block below (that one only configures the verification
// table's storage). The previous config put expiresIn under
// `verification`, where it was ignored, and never configured a sender —
// so no verification email was ever sent and the verify-email route had
// nothing to verify.
export const emailVerificationOptions = {
  sendOnSignUp: true,
  expiresIn: 300, // 5 minutes
  sendVerificationEmail: async ({ user, url }) => {
    const template = await emailTemplates.emailVerification(url, user.name || user.email);
    const result = await emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (!result.success) {
      logger.error("Failed to send email verification email", result.error);
      throw new Error("Failed to send email verification email");
    }
  },
} satisfies BetterAuthOptions["emailVerification"];

// Verification-table storage behavior (cleanup of expired rows stays on).
export const verificationOptions = {
  disableCleanup: false,
} satisfies BetterAuthOptions["verification"];
