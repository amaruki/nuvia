/**
 * Consolidated Better Auth configuration
 *
 * This module provides the main Better Auth setup with clean, modular configuration
 * that leverages our consolidated auth utilities to eliminate redundancy.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { validatePasswordStrength } from "./utils/password";
import { env } from "@/lib/env";
import { renderEmailTemplate } from "./email-utils";
import { invalidateUserSessionCaches } from "./session-cache";
import { logger } from "./logger";
import PasswordResetEmail from "@/components/email-template/password-reset";
import EmailVerificationEmail from "@/components/email-template/email-verification";
import WelcomeEmail from "@/components/email-template/welcome";
import React from "react";
import { getOrganization } from "./services/organization.service";
import { AuthError, AuthErrorType } from "./auth/common";

// TODO: Move email service logic to a separate module
// TODO: Add support for multiple OAuth providers (GitHub, LinkedIn)
// TODO: Add support for multi-factor authentication

// Environment configuration
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Validate required environment variables
const validateEnvironment = () => {
  const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

  if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET === "your-secret-key-here") {
    const message = "BETTER_AUTH_SECRET is not properly configured";

    if (isProduction) {
      throw new AuthError(AuthErrorType.INTERNAL, message);
    }

    logger.warn(`WARNING: ${message}`);
  }

  if (!env.APP_URL) {
    throw new AuthError(AuthErrorType.INTERNAL, "APP_URL environment variable is required");
  }
};

validateEnvironment();

/**
 * Email service types
 */
type EmailServiceType = "resend" | "nodemailer" | "none";

/**
 * Email service configuration class
 */
class EmailService {
  private service: EmailServiceType = "none";
  private resendClient: any = null;
  private nodemailerTransporter: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Initialize Resend if available
    if (process.env.RESEND_API_KEY) {
      this.service = "resend";
      try {
        const { Resend } = await import("resend");
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        logger.info("✅ Resend email service initialized");
      } catch (error) {
        logger.warn("❌ Failed to initialize Resend", error);
        this.service = "none";
      }
    }
    // Initialize Nodemailer if available
    else if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
      this.service = "nodemailer";
      try {
        const { createTransport } = await import("nodemailer");
        this.nodemailerTransporter = createTransport({
          host: env.EMAIL_HOST,
          port: env.EMAIL_PORT,
          secure: env.EMAIL_PORT === 465,
          auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS,
          },
        });
        logger.info("✅ Nodemailer email service initialized");
      } catch (error) {
        logger.warn("❌ Failed to initialize Nodemailer", error);
        this.service = "none";
      }
    }
    // No email service configured
    else {
      logger.warn("⚠️ No email service configured. Email functionality will be disabled.");
    }
  }

  /**
   * Send an email using the configured service
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Development mode fallback
      if (this.service === "none" && !isProduction) {
        logger.info("📧 Email would be sent (development mode)", {
          to: options.to,
          subject: options.subject,
          textPreview: options.text?.substring(0, 100) + "...",
        });
        return { success: true };
      }

      const from = options.from || env.EMAIL_FROM;

      if (this.service === "resend" && this.resendClient) {
        const { data, error } = await this.resendClient.emails.send({
          from,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
          replyTo: options.replyTo,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }

        logger.info("✅ Email sent via Resend", data);
        return { success: true };
      }

      if (this.service === "nodemailer" && this.nodemailerTransporter) {
        const mailOptions = {
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          replyTo: options.replyTo,
        };

        const result = await this.nodemailerTransporter.sendMail(mailOptions);
        logger.info("✅ Email sent via Nodemailer", result.messageId);
        return { success: true };
      }

      throw new Error("No email service is properly configured");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown email error";
      logger.error("❌ Failed to send email", errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

// Initialize email service
const emailService = new EmailService();

/**
 * Email templates factory
 */
export const emailTemplates = {
  passwordReset: async (resetUrl: string, userName?: string) => {
    const organization = await getOrganization();
    const component = React.createElement(PasswordResetEmail, {
      resetUrl,
      userName,
      organizationName: organization.name,
      supportEmail: organization.supportEmail ?? undefined,
    });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: `Reset your ${organization.name} password`,
      html,
      text,
    };
  },

  emailVerification: async (verificationUrl: string, userName?: string) => {
    const organization = await getOrganization();
    const component = React.createElement(EmailVerificationEmail, {
      verificationUrl,
      userName,
      organizationName: organization.name,
      supportEmail: organization.supportEmail ?? undefined,
    });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: `Verify your ${organization.name} email address`,
      html,
      text,
    };
  },

  welcome: async (userName?: string) => {
    const organization = await getOrganization();
    const component = React.createElement(WelcomeEmail, {
      userName,
      dashboardUrl: `${env.APP_URL}/dashboard`,
      organizationName: organization.name,
      supportEmail: organization.supportEmail ?? undefined,
    });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: `Welcome to ${organization.name}!`,
      html,
      text,
    };
  },
};

/**
 * Username generator for OAuth users
 */
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");
  let counter = 1;
  let uniqueUsername = username;

  // Check if username exists and generate unique one if needed
  while (
    await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.username, uniqueUsername),
      columns: { id: true },
    })
  ) {
    uniqueUsername = `${username}${counter}`;
    counter++;

    // Prevent infinite loop
    if (counter > 9999) {
      uniqueUsername = `${username}_${Date.now()}`;
      break;
    }
  }

  return uniqueUsername;
}

/**
 * OAuth profile mapping helper
 */
function mapOAuthProfileToUser(profile: any) {
  const baseUsername = profile.email?.split("@")[0] || "user";
  const cleanUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");

  return {
    name: profile.given_name || profile.name,
    email: profile.email,
    image: profile.picture,
    username: cleanUsername,
  };
}

/**
 * Main Better Auth configuration
 */
export const auth = betterAuth({
  // Core configuration
  baseURL: env.APP_URL,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development",

  // Database configuration
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // Database hooks for user management
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Handle username generation for OAuth users
          if (user.username && typeof user.username === "string") {
            const uniqueUsername = await generateUniqueUsername(user.username);
            return {
              data: {
                ...user,
                username: uniqueUsername,
              },
            };
          }

          return { data: user };
        },
      },
    },
    session: {
      delete: {
        // When a session is revoked (sign-out, revokeSession, password
        // change with revokeOtherSessions), drop its owner's entries from
        // the optional Redis session cache too. Otherwise a revoked
        // session's cached identity stays servable by
        // validateSessionWithCache until the 60s TTL lapses.
        after: async (session) => {
          try {
            await invalidateUserSessionCaches(session.userId);
          } catch (error) {
            logger.warn("Failed to invalidate session cache on session delete", error);
          }
        },
      },
    },
  },

  // Email and password authentication
  emailAndPassword: {
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
  },

  // Social providers configuration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      redirectUri: `${env.APP_URL}/api/auth/callback/google`,
      accessType: "offline",
      prompt: "consent",
      scopes: ["openid", "profile", "email"],
      mapProfileToUser: mapOAuthProfileToUser,
    },
    // TODO: Add GitHub provider
    // TODO: Add LinkedIn provider
  },

  // Account linking configuration
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieOptions: {
      secure: isProduction,
      // Always "lax", never `isProduction ? "none" : "lax"` — SameSite=None
      // disabled the browser's CSRF defense on a first-party app with no
      // cross-site cookie need. See docs/adr/0009-security-hardening-p0.md.
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    },
  },

  // User fields configuration
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      displayName: {
        type: "string",
        required: false,
      },
      profilePhoto: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      externalLinks: {
        type: "json",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Critical: Users cannot set their own role
      },
    },
    // Hard-deletes the user row (cascades to sessions, accounts, active
    // devices, login activity, password reset tokens, and role-change
    // history via each table's onDelete: "cascade" FK). Will start
    // throwing a foreign-key violation for any user who has authored
    // content/events/forum posts/job postings once those M3 domains move
    // off mock data onto real Drizzle tables — those FKs are NOT NULL
    // with no cascade today. Revisit then (anonymize instead of delete,
    // or reassign authorship) rather than assuming this stays safe.
    deleteUser: {
      enabled: true,
    },
  },

  // Rate limiting configuration
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },

  // Email verification configuration. Key name matters: better-auth reads
  // sendVerificationEmail/expiresIn from `emailVerification`, not from the
  // `verification` block below (that one only configures the verification
  // table's storage). The previous config put expiresIn under
  // `verification`, where it was ignored, and never configured a sender —
  // so no verification email was ever sent and the verify-email route had
  // nothing to verify.
  emailVerification: {
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
  },

  // Verification-table storage behavior (cleanup of expired rows stays on).
  verification: {
    disableCleanup: false,
  },

  // Next.js cookies plugin
  plugins: [nextCookies()],

  // Advanced configuration with environment-aware settings
  advanced: {
    useSecureCookies: isProduction,
    cookieOptions: {
      sameSite: "lax", // see comment on session.cookieOptions above
      secure: isProduction,
      httpOnly: true,
      path: "/",
    },
    cookiePrefix: "nuvia-auth",
    trustedOrigins: isProduction
      ? [env.APP_URL]
      : [env.APP_URL, "http://localhost:3000", "http://localhost:3001"],
    generateState: true,
    stateOptions: {
      maxAge: 600, // 10 minutes
      sameSite: "lax", // see comment on session.cookieOptions above
      path: "/",
      httpOnly: true,
      secure: isProduction,
    },
    hooks: {
      onError: async (event: any) => {
        logger.error("Better Auth Error", {
          event: event.name,
          error: event.error?.message || event.error,
          context: event.context,
          stack: isDevelopment ? event.error?.stack : undefined,
        });
      },
      beforeOAuthStart: async (event: any) => {
        if (isDevelopment) {
          logger.info("Starting OAuth Flow", {
            provider: event.provider,
            state: event.state,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onOAuthAccountCreation: async (event: any) => {
        logger.info("OAuth Account Creation", {
          provider: event.provider,
          email: event.email,
          timestamp: new Date().toISOString(),
        });
      },
      onOAuthSignIn: async (event: any) => {
        logger.info("OAuth Sign In", {
          provider: event.provider,
          email: event.email,
          timestamp: new Date().toISOString(),
        });
      },
      beforeOAuthCallback: async (event: any) => {
        if (isDevelopment) {
          logger.info("Before OAuth Callback", {
            provider: event.provider,
            state: event.state,
            query: event.query,
            timestamp: new Date().toISOString(),
          });
        }
      },
    },
  },

  // Logger configuration
  logger: {
    level: isDevelopment ? "debug" : "warn",
    disabled: isProduction,
  },

  // Global error handler
  onError: (error: any) => {
    logger.error("Better Auth Error", error?.message || error);
  },
});

/**
 * Export commonly used utilities
 */
export const passwordUtils = {
  validatePasswordStrength,
};

export { emailService };
