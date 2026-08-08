/**
 * Auth helpers: environment validation, OAuth profile mapping, unique
 * username generation, the user-creation database hook built on them, and
 * the password-strength utility re-export.
 *
 * Split out of the old monolithic src/lib/auth.ts; re-exported via
 * src/lib/auth/index.ts.
 */

import type { BetterAuthOptions } from "better-auth";
import { db } from "@/db/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { validatePasswordStrength } from "@/lib/utils/password";
import { AuthError, AuthErrorType } from "./common";

// Environment configuration
export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";

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
 * Username generator for OAuth users
 */
export async function generateUniqueUsername(baseUsername: string): Promise<string> {
  const username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");

  // One prefix query replaces one DB round trip per collision. LIKE is
  // case-sensitive, matching the old eq() probes and the app's lowercase
  // username storage; a literal `_` in the base only widens the fetch, and
  // Set membership below is exact-string, so no candidate is misjudged.
  const existing = await db.query.user.findMany({
    where: (user, { like }) => like(user.username, `${username}%`),
    columns: { username: true },
  });
  const taken = new Set(existing.map((row) => row.username));

  if (!taken.has(username)) {
    return username;
  }

  // Mirrors the old loop's cap: it probed base1..base9998 and, once all were
  // taken, returned a timestamped suffix without a final uniqueness check.
  for (let counter = 1; counter <= 9998; counter++) {
    const candidate = `${username}${counter}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return `${username}_${Date.now()}`;
}

/**
 * OAuth profile mapping helper
 */
export function mapOAuthProfileToUser(profile: any) {
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
 * Database hook: normalize usernames on user creation (OAuth sign-up passes
 * a cleaned email-prefix candidate through generateUniqueUsername).
 */
export const userDatabaseHooks = {
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
} satisfies NonNullable<BetterAuthOptions["databaseHooks"]>["user"];

/**
 * Export commonly used utilities
 */
export const passwordUtils = {
  validatePasswordStrength,
};
