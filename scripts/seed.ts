/**
 * Seed script — creates one admin account per privileged role for local
 * development.
 *
 * P0 fix (see docs/adr/0009-security-hardening-p0.md): the previous version
 * of this script (prisma/seed.ts) hardcoded the same password,
 * 'Admin123!@#', into five privileged accounts including superadmin, and
 * committed it to git — `bun run db:seed` was a documented setup step, so
 * every default install shared one known superadmin password. This version
 * requires SEED_ADMIN_PASSWORD to be set and refuses to run without it.
 *
 * `scripts/*.ts` is one of the few places allowed to read `process.env`
 * directly (see src/lib/env.ts) — it runs standalone, outside the Next.js
 * request lifecycle the validated `env` export assumes.
 */

import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { account, activeDevice, session, user, userLoginActivity } from "@/db/schema";
import { auth } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/utils/password";

const seedPassword = process.env.SEED_ADMIN_PASSWORD;

if (!seedPassword) {
  console.error(
    "SEED_ADMIN_PASSWORD is not set. Refusing to seed admin accounts with a " +
      "guessable or shared password. Set it to a strong password you will " +
      "remember — you will sign in with it — before running `bun run db:seed`, e.g.:\n\n" +
      "  SEED_ADMIN_PASSWORD='Your-Strong-Passw0rd' bun run db:seed\n",
  );
  process.exit(1);
}

const passwordCheck = validatePasswordStrength(seedPassword);
if (!passwordCheck.isValid) {
  console.error(
    `SEED_ADMIN_PASSWORD does not meet password requirements:\n  - ${passwordCheck.errors.join("\n  - ")}`,
  );
  process.exit(1);
}

const adminUsers = [
  {
    username: "superadmin",
    email: "admin@nuvia.com",
    firstName: "Super",
    lastName: "Admin",
    role: "superadmin" as const,
    bio: "System administrator with full access to all platform features",
    externalLinks: {
      linkedin: "https://linkedin.com/in/nuvia-admin",
      website: "https://nuvia.com",
    },
  },
  {
    username: "admin",
    email: "administrator@nuvia.com",
    firstName: "Platform",
    lastName: "Administrator",
    role: "admin" as const,
    bio: "Platform administrator managing daily operations and user management",
    externalLinks: {
      linkedin: "https://linkedin.com/in/nuvia-platform-admin",
      website: "https://nuvia.com",
    },
  },
  {
    username: "staff_manager",
    email: "staff@nuvia.com",
    firstName: "Staff",
    lastName: "Manager",
    role: "staff" as const,
    bio: "Operations staff managing events and member services",
    externalLinks: {
      linkedin: "https://linkedin.com/in/nuvia-staff",
      website: "https://nuvia.com",
    },
  },
  {
    username: "treasurer",
    email: "finance@nuvia.com",
    firstName: "Finance",
    lastName: "Manager",
    role: "treasurer" as const,
    bio: "Financial manager overseeing billing and transactions",
    externalLinks: {
      linkedin: "https://linkedin.com/in/nuvia-treasurer",
      website: "https://nuvia.com",
    },
  },
  {
    username: "content_moderator",
    email: "moderator@nuvia.com",
    firstName: "Content",
    lastName: "Moderator",
    role: "moderator" as const,
    bio: "Content moderator managing forum posts and community content",
    externalLinks: {
      linkedin: "https://linkedin.com/in/nuvia-moderator",
      website: "https://nuvia.com",
    },
  },
];

async function cleanupExistingUser(email: string): Promise<void> {
  const existingUser = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.email, email) });

  if (!existingUser) return;

  console.log(`Cleaning up existing user: ${email}`);

  await db.delete(userLoginActivity).where(inArray(userLoginActivity.userId, [existingUser.id]));
  await db.delete(session).where(inArray(session.userId, [existingUser.id]));
  await db.delete(account).where(inArray(account.userId, [existingUser.id]));
  await db.delete(activeDevice).where(inArray(activeDevice.userId, [existingUser.id]));
  await db.delete(user).where(inArray(user.id, [existingUser.id]));

  console.log(`Cleaned up user: ${email}`);
}

async function createAdminUser(userData: (typeof adminUsers)[number]): Promise<void> {
  await cleanupExistingUser(userData.email);

  console.log(`Creating admin user: ${userData.email}`);

  // auth.api.* (server-side) throws on failure rather than returning
  // { data, error } the way the client SDK does — let it propagate to
  // main()'s catch handler.
  await auth.api.signUpEmail({
    body: {
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      password: seedPassword!,
      username: userData.username,
    },
  });

  const createdUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.email, userData.email),
  });

  if (!createdUser) {
    throw new Error(`User not found after creation: ${userData.email}`);
  }

  await db
    .update(user)
    .set({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      bio: userData.bio,
      externalLinks: userData.externalLinks,
      role: userData.role,
      emailVerified: true, // Admins start with verified email
    })
    .where(inArray(user.id, [createdUser.id]));

  await db.insert(userLoginActivity).values({
    userId: createdUser.id,
    ipAddress: "127.0.0.1",
    userAgent: "Seed Script v2.0",
    deviceType: "desktop",
    location: "Local",
    loginAt: new Date(),
    successful: true,
  });

  console.log(`Seeded ${userData.role}: ${userData.email}`);
}

async function main() {
  console.log("Starting admin user seeding...\n");

  for (const adminUser of adminUsers) {
    await createAdminUser(adminUser);
  }

  const seededRoles = adminUsers.map((u) => u.role);
  const created = await db.query.user.findMany({
    where: (u, { inArray: inArrayOp }) => inArrayOp(u.role, seededRoles),
    orderBy: (u, { asc }) => [asc(u.role), asc(u.createdAt)],
  });

  console.log(`\nSeeded ${created.length} admin accounts:`);
  created.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.email} (${admin.role})`);
  });

  console.log("\nHOW TO SIGN IN:");
  console.log("  - Open /auth/login in your browser.");
  console.log("  - Use any email or username above with the password you passed as");
  console.log("    SEED_ADMIN_PASSWORD when you ran this script.");
  console.log("  - The password is not printed here for security. If you did not");
  console.log("    note it, re-run the seed with a password you will remember:");
  console.log("      SEED_ADMIN_PASSWORD='Your-New-Passw0rd' bun run db:seed");

  console.log("\nSECURITY WARNING:");
  console.log("  - Rotate these passwords after first login.");
  console.log("  - Do not reuse SEED_ADMIN_PASSWORD across environments.");
  console.log(
    "  - Remove or restrict this script before a production deploy that has real members.",
  );
}

main()
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
