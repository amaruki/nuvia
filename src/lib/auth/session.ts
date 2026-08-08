/**
 * Session seam: session lifetime, cookie policy, and the session-delete
 * hook that keeps the optional Redis session cache in sync with revocation.
 *
 * Split out of the old monolithic src/lib/auth.ts.
 */

import type { BetterAuthOptions, CookieOptions } from "better-auth";
import { logger } from "@/lib/logger";
import { invalidateUserSessionCaches } from "../session-cache";
import { isProduction } from "./helpers";

// Session configuration
export const sessionOptions = {
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
} satisfies BetterAuthOptions["session"] & {
  // Not part of better-auth's public session options (and unread by its
  // runtime — the cookie policy better-auth actually consumes comes from
  // advanced.useSecureCookies plus library defaults); carried verbatim from
  // the original inline config for parity.
  cookieOptions?: CookieOptions;
};

export const sessionDatabaseHooks = {
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
} satisfies NonNullable<BetterAuthOptions["databaseHooks"]>["session"];
