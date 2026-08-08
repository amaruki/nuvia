/**
 * Login activity recording and identifier resolution for the sign-in flow.
 *
 * The userLoginActivity table (src/db/schema/users.ts) existed with no
 * writer and a placeholder reader. This module is the writer, and it also
 * fixes the username half of the login contract: the login form and API
 * both accept "email or username", but the value was forwarded to
 * better-auth's signInEmail verbatim, so username sign-in silently never
 * worked.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user, userLoginActivity } from "@/db/schema";
import { logger } from "@/lib/logger";

/**
 * Resolve the login form's "email or username" field to the email address
 * better-auth's signInEmail needs. Input containing an "@" is treated as
 * an email and returned as-is (lowercased); anything else is looked up as
 * a username. Unknown identifiers are returned unchanged so sign-in fails
 * with better-auth's generic invalid-credentials error — no oracle for
 * which usernames exist.
 */
export async function resolveLoginIdentifier(emailOrUsername: string): Promise<string> {
  const trimmed = emailOrUsername.trim();

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  const byUsername = await db.query.user.findFirst({
    where: eq(user.username, trimmed.toLowerCase()),
    columns: { email: true },
    // username is not unique in the schema yet (see TODO.md); pick the
    // oldest account so resolution is at least deterministic.
    orderBy: [asc(user.createdAt)],
  });

  return byUsername?.email ?? trimmed;
}

/**
 * Best-effort login activity recording. Never throws: auditing a sign-in
 * attempt must not be able to break the sign-in itself.
 *
 * The row requires a userId (NOT NULL foreign key), so attempts for
 * unknown emails/usernames are skipped — there is no user row to attach
 * them to. Wrong-password attempts for a real user are recorded, which is
 * the brute-force surface this table exists to show.
 */
export async function recordLoginAttempt(opts: {
  emailOrUsername: string;
  successful: boolean;
  headers: Headers;
}): Promise<void> {
  try {
    const identifier = opts.emailOrUsername.trim().toLowerCase();

    const targetUser = await db.query.user.findFirst({
      where: identifier.includes("@") ? eq(user.email, identifier) : eq(user.username, identifier),
      columns: { id: true },
    });

    if (!targetUser) {
      return;
    }

    await db.insert(userLoginActivity).values({
      userId: targetUser.id,
      ipAddress:
        opts.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        opts.headers.get("x-real-ip") ||
        "unknown",
      userAgent: opts.headers.get("user-agent") || null,
      successful: opts.successful,
    });
  } catch (error) {
    logger.warn("Failed to record login activity", error);
  }
}
