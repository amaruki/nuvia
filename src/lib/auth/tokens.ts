/**
 * Token seam: lifecycle of short-lived auth tokens — password-reset tokens
 * and email-verification tokens — including their delivery via email.
 *
 * Split out of the old monolithic src/lib/auth.ts.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { BetterAuthOptions } from "better-auth";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { validatePasswordStrength } from "@/lib/utils/password";
import { emailService, emailTemplates } from "./email";

// Test-only password hashing. better-auth's default scrypt parameters
// (N=16384) take ~60ms per call; suites that exercise dozens of
// sign-ups/sign-ins pay seconds of pure CPU per run. The integration stack
// is dropped and re-seeded on every run, so test rows never need the
// production cost — in test environments a deliberately cheap scrypt
// (N=1024, ~4ms) is swapped in behind the seam better-auth documents
// (emailAndPassword.password.{hash,verify}, read in better-auth's
// create-context). Production builds keep the library default.
//
// Gate: env.TEST_FAST_PASSWORD_HASH, with NODE_ENV=test as the fallback
// bun-test runs get automatically. The explicit flag exists because the
// a11y gate's `next dev` process does not keep NODE_ENV=test (Next forces
// development), while the seed script that wrote the hashes does — with a
// NODE_ENV-only gate the two sides disagree and every sign-in throws
// "Invalid password hash". Whatever process hashes test passwords and
// whatever process verifies them must see the same gate.
const isTest = env.TEST_FAST_PASSWORD_HASH || env.NODE_ENV === "test";
const TEST_HASH_PREFIX = "test-scrypt$";

async function testHashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 });
  return `${TEST_HASH_PREFIX}${salt}$${derived.toString("hex")}`;
}

async function testVerifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (!hash.startsWith(TEST_HASH_PREFIX)) return false;
  const [, saltHex, derivedHex] = hash.split("$");
  if (!saltHex || !derivedHex) return false;
  const derived = scryptSync(password, saltHex, 64, { N: 1024, r: 8, p: 1 });
  const expected = Buffer.from(derivedHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// Email and password authentication
export const emailAndPasswordOptions = {
  enabled: true,
  autoSignIn: true,
  // Test-only swap, see TEST_HASH_PREFIX above; never active in production.
  ...(isTest ? { password: { hash: testHashPassword, verify: testVerifyPassword } } : {}),
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
  // Test runs sign users up dozens of times; rendering and "sending" a
  // verification email each time adds seconds of template work the tests
  // never assert on (verify-email.test.ts mints its own token). Dev and
  // production keep real delivery wiring.
  sendOnSignUp: !isTest,
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
