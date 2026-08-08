/**
 * B1 — Members API integration suite: shared fixtures.
 *
 * Service-level coverage for the member directory (listMembers,
 * getMemberDetail) against the shared test database (DATABASE_URL from
 * .env). Each concern lives in its own *.test.ts file in this folder; every
 * file is self-contained: createFixtures() gives it its own COHORT/TIER
 * stamp and cleanup registry, the cohort is seeded in beforeAll, and every
 * row a file creates is removed by cleanup() in afterAll.
 *
 * The derived member status must match the A3 derivation (ADR-0014): the
 * service imports `deriveMemberStatus`; these tests assert the derivation's
 * outcome for active, canceled (in grace / expired), past_due (in grace /
 * expired), paused, trialing and no-subscription users end to end.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, membershipTier, user } from "@/db/schema";

const DAY = 86_400_000;
const daysFromNow = (days: number): Date => new Date(Date.now() + days * DAY);

type NewSubscription = typeof membershipSubscription.$inferInsert;

export interface CohortMember {
  slug: string;
  role: string;
  deleted?: boolean;
}

/**
 * One isolated fixture set; create one per test file. bun runs all files in
 * one process, so a module-level COHORT stamp would collide across files on
 * the fixture usernames/emails and on the `search=COHORT` row counts.
 */
export function createFixtures() {
  const stamp = `${Date.now()}${Math.random().toString(36).slice(2)}`;
  /** Unique per run; every fixture username/email/name contains it, which
   * lets the search filter scope all assertions to this file's cohort. */
  const COHORT = `b1mem${stamp}`;
  const TIER_NAME = `b1-tier-${stamp}`;

  const createdUserIds: string[] = [];
  let tierId: string;

  /** slug -> user id, filled in seedCohort. */
  const ids: Record<string, string> = {};

  async function createUser(slug: string, opts: CohortMember): Promise<string> {
    const username = `${COHORT}-${slug}`;
    const [row] = await db
      .insert(user)
      .values({
        username,
        email: `${username}@example.test`,
        name: `B1 ${COHORT} ${slug}`,
        firstName: "B1",
        lastName: slug,
        role: opts.role,
        emailVerified: true,
        deletedAt: opts.deleted ? new Date() : null,
      })
      .returning({ id: user.id });

    createdUserIds.push(row.id);
    return row.id;
  }

  async function addSubscription(
    userId: string,
    status: NewSubscription["status"],
    overrides: Partial<NewSubscription> = {},
  ): Promise<string> {
    const periodEnd = overrides.currentPeriodEnd ?? daysFromNow(30);
    const [row] = await db
      .insert(membershipSubscription)
      .values({
        userId,
        tierId,
        status,
        currentPeriodStart: new Date(periodEnd.getTime() - 30 * DAY),
        currentPeriodEnd: periodEnd,
        ...overrides,
      })
      .returning({ id: membershipSubscription.id });

    return row.id;
  }

  /** Seed the full cohort: one tier, nine members, one soft-deleted user. */
  async function seedCohort() {
    const [tier] = await db
      .insert(membershipTier)
      .values({
        name: TIER_NAME,
        displayName: "B1 Test Tier",
        price: "100.00",
        billingCycle: "monthly",
        features: [],
        benefits: [],
        permissions: [],
      })
      .returning({ id: membershipTier.id });
    tierId = tier.id;

    ids.active = await createUser("active", { slug: "active", role: "member" });
    await addSubscription(ids.active, "ACTIVE");

    ids.gracecancel = await createUser("gracecancel", {
      slug: "gracecancel",
      role: "member",
    });
    await addSubscription(ids.gracecancel, "CANCELED", {
      currentPeriodEnd: daysFromNow(10),
      canceledAt: daysFromNow(-2),
      cancelAtPeriodEnd: true,
    });

    ids.lapsedcancel = await createUser("lapsedcancel", {
      slug: "lapsedcancel",
      role: "member",
    });
    await addSubscription(ids.lapsedcancel, "CANCELED", {
      currentPeriodEnd: daysFromNow(-10),
      canceledAt: daysFromNow(-40),
    });

    ids.pastduefresh = await createUser("pastduefresh", {
      slug: "pastduefresh",
      role: "member",
    });
    await addSubscription(ids.pastduefresh, "PAST_DUE", {
      currentPeriodEnd: daysFromNow(-1),
    });

    ids.pastdueold = await createUser("pastdueold", {
      slug: "pastdueold",
      role: "member",
    });
    await addSubscription(ids.pastdueold, "PAST_DUE", {
      currentPeriodEnd: daysFromNow(-30),
    });

    ids.trial = await createUser("trial", { slug: "trial", role: "member" });
    await addSubscription(ids.trial, "TRIALING", {
      trialStart: daysFromNow(-5),
      trialEnd: daysFromNow(5),
    });

    ids.paused = await createUser("paused", { slug: "paused", role: "member" });
    await addSubscription(ids.paused, "PAUSED");

    ids.nosub = await createUser("nosub", { slug: "nosub", role: "user" });

    ids.renewed = await createUser("renewed", {
      slug: "renewed",
      role: "member",
    });
    await addSubscription(ids.renewed, "CANCELED", {
      currentPeriodEnd: daysFromNow(-35),
      canceledAt: daysFromNow(-40),
      createdAt: daysFromNow(-40),
    });
    await addSubscription(ids.renewed, "ACTIVE", {
      currentPeriodEnd: daysFromNow(30),
    });

    ids.deleted = await createUser("deleted", {
      slug: "deleted",
      role: "member",
      deleted: true,
    });
    await addSubscription(ids.deleted, "ACTIVE");
  }

  async function cleanup() {
    // Subscriptions cascade off the user rows; the tier row is removed last,
    // once nothing references it anymore.
    for (const id of createdUserIds) {
      await db.delete(user).where(eq(user.id, id));
    }
    await db.delete(membershipTier).where(eq(membershipTier.id, tierId));
  }

  return {
    COHORT,
    TIER_NAME,
    ids,
    seedCohort,
    cleanup,
  };
}
