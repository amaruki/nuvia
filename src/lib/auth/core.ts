/**
 * Main Better Auth configuration, assembled from the seam modules:
 * session (./session.ts), tokens (./tokens.ts), permissions
 * (./permissions.ts), helpers (./helpers.ts), and email delivery
 * (./email.ts). Import { auth } from "@/lib/auth" (the ./index.ts barrel).
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { isDevelopment, isProduction, mapOAuthProfileToUser, userDatabaseHooks } from "./helpers";
import { sessionDatabaseHooks, sessionOptions } from "./session";
import { emailAndPasswordOptions, emailVerificationOptions, verificationOptions } from "./tokens";
import { userOptions } from "./permissions";

// TODO: Add support for multiple OAuth providers (GitHub, LinkedIn)
// TODO: Add support for multi-factor authentication

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
    user: userDatabaseHooks,
    session: sessionDatabaseHooks,
  },

  // Email and password authentication
  emailAndPassword: emailAndPasswordOptions,

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
  session: sessionOptions,

  // User fields configuration
  user: userOptions,

  // Rate limiting configuration
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },

  // Email verification configuration (token lifetime + sender live in
  // ./tokens.ts; see the comment there on why the key names matter).
  emailVerification: emailVerificationOptions,

  // Verification-table storage behavior
  verification: verificationOptions,

  // Next.js cookies plugin
  plugins: [nextCookies()],

  // Advanced configuration with environment-aware settings
  advanced: {
    useSecureCookies: isProduction,
    cookieOptions: {
      sameSite: "lax", // see comment on sessionOptions.cookieOptions in ./session.ts
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
      sameSite: "lax", // see comment on sessionOptions.cookieOptions in ./session.ts
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
