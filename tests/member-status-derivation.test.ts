/**
 * Tests for ADR-0014: member status is derived from the membership
 * subscription lifecycle, never stored independently.
 *
 * The pure derivation is exercised with fixed timestamps, one case per
 * lifecycle transition. The db-backed sync runs against the shared test
 * database and cleans up its own rows in afterAll.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, membershipSubscription, membershipTier, user } from "@/db/schema";
import {
  PAST_DUE_GRACE_DAYS,
  deriveMemberStatus,
  deriveRoleFromMemberStatus,
  syncMemberStatusFromSubscription,
  type SubscriptionSnapshot,
} from "@/lib/services/membership-status.service";

const DAY = 86_400_000;
const NOW = new Date("2026-03-15T12:00:00Z");

const daysFromNow = (days: number): Date => new Date(NOW.getTime() + days * DAY);

const snapshot = (
  status: SubscriptionSnapshot["status"],
  overrides: Partial<SubscriptionSnapshot> = {},
): SubscriptionSnapshot => ({
  status,
  currentPeriodEnd: daysFromNow(30),
  trialEnd: null,
  ...overrides,
});

describe("deriveMemberStatus — one case per lifecycle transition (ADR-0014 mapping)", () => {
  test("no subscription row derives none", () => {
    expect(deriveMemberStatus(null, NOW)).toBe("none");
  });

  test("ACTIVE inside the paid period derives active", () => {
    expect(deriveMemberStatus(snapshot("ACTIVE"), NOW)).toBe("active");
  });

  test("TRIALING inside the trial window derives trialing", () => {
    const sub = snapshot("TRIALING", {
      trialEnd: daysFromNow(5),
      currentPeriodEnd: daysFromNow(5),
    });
    expect(deriveMemberStatus(sub, NOW)).toBe("trialing");
  });

  test("CANCELED inside the paid-through period derives in_grace", () => {
    expect(deriveMemberStatus(snapshot("CANCELED"), NOW)).toBe("in_grace");
  });

  test("PAST_DUE inside the retry grace window derives in_grace", () => {
    const sub = snapshot("PAST_DUE", { currentPeriodEnd: daysFromNow(-1) });
    expect(deriveMemberStatus(sub, NOW)).toBe("in_grace");
  });

  test("UNPAID derives expired — every payment attempt failed, no grace", () => {
    expect(deriveMemberStatus(snapshot("UNPAID"), NOW)).toBe("expired");
  });

  test("PAUSED derives paused", () => {
    expect(deriveMemberStatus(snapshot("PAUSED"), NOW)).toBe("paused");
  });
});

describe("deriveMemberStatus — time boundaries the mapping depends on", () => {
  test("ACTIVE past its period end derives expired even before the provider notices", () => {
    const sub = snapshot("ACTIVE", { currentPeriodEnd: daysFromNow(-1) });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("ACTIVE with an unset period end derives active", () => {
    const sub = snapshot("ACTIVE", { currentPeriodEnd: null });
    expect(deriveMemberStatus(sub, NOW)).toBe("active");
  });

  test("TRIALING past the trial end derives expired", () => {
    const sub = snapshot("TRIALING", {
      trialEnd: daysFromNow(-1),
      currentPeriodEnd: daysFromNow(5),
    });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("CANCELED past the paid-through period derives expired", () => {
    const sub = snapshot("CANCELED", { currentPeriodEnd: daysFromNow(-1) });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("CANCELED with an unset period end derives expired", () => {
    const sub = snapshot("CANCELED", { currentPeriodEnd: null });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("PAST_DUE past the grace window derives expired", () => {
    const sub = snapshot("PAST_DUE", { currentPeriodEnd: daysFromNow(-(PAST_DUE_GRACE_DAYS + 1)) });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("PAST_DUE with an unset period end derives in_grace — no anchor proves lapse", () => {
    const sub = snapshot("PAST_DUE", { currentPeriodEnd: null });
    expect(deriveMemberStatus(sub, NOW)).toBe("in_grace");
  });
});

describe("deriveRoleFromMemberStatus — the role-sync rules", () => {
  test("an entitled bare user upgrades to the default member role", () => {
    expect(deriveRoleFromMemberStatus("user", "active")).toBe("member");
    expect(deriveRoleFromMemberStatus("user", "trialing")).toBe("member");
    expect(deriveRoleFromMemberStatus("user", "in_grace")).toBe("member");
  });

  test("an entitled user keeps their specific member-tier role", () => {
    expect(deriveRoleFromMemberStatus("member_student", "active")).toBe("member_student");
    expect(deriveRoleFromMemberStatus("member_corporate", "trialing")).toBe("member_corporate");
  });

  test("a non-entitled member-tier role downgrades to user", () => {
    expect(deriveRoleFromMemberStatus("member", "expired")).toBe("user");
    expect(deriveRoleFromMemberStatus("member_professional", "paused")).toBe("user");
    expect(deriveRoleFromMemberStatus("member", "none")).toBe("user");
  });

  test("privileged and custom roles are never touched by subscription state", () => {
    expect(deriveRoleFromMemberStatus("admin", "active")).toBe("admin");
    expect(deriveRoleFromMemberStatus("moderator", "expired")).toBe("moderator");
    expect(deriveRoleFromMemberStatus("some_custom_role", "none")).toBe("some_custom_role");
  });
});

describe("syncMemberStatusFromSubscription — db-backed sync on the shared test DB", () => {
  const createdUserIds: string[] = [];
  let tierId: string;

  type NewSubscription = typeof membershipSubscription.$inferInsert;

  async function createTestUser(role: string): Promise<string> {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [row] = await db
      .insert(user)
      .values({
        username: `adr0014-${stamp}`,
        email: `adr0014-${stamp}@example.test`,
        name: "ADR-0014 Test",
        role,
        emailVerified: false,
      })
      .returning({ id: user.id });

    createdUserIds.push(row.id);
    return row.id;
  }

  async function createSubscription(
    userId: string,
    status: NewSubscription["status"],
    overrides: Partial<Pick<NewSubscription, "currentPeriodEnd" | "trialEnd">> = {},
  ): Promise<string> {
    const periodEnd = overrides.currentPeriodEnd ?? new Date(Date.now() + 30 * DAY);

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

  async function readRole(userId: string): Promise<string | undefined> {
    const row = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { role: true },
    });
    return row?.role;
  }

  beforeAll(async () => {
    const [tier] = await db
      .insert(membershipTier)
      .values({
        name: `adr0014-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        displayName: "ADR-0014 Test Tier",
        price: "100.00",
        billingCycle: "monthly",
        features: [],
        benefits: [],
        permissions: [],
      })
      .returning({ id: membershipTier.id });

    tierId = tier.id;
  });

  afterAll(async () => {
    // Subscriptions and auth-log rows cascade off the user rows; the tier
    // row is removed last, once nothing references it anymore.
    for (const id of createdUserIds) {
      await db.delete(user).where(eq(user.id, id));
    }
    await db.delete(membershipTier).where(eq(membershipTier.id, tierId));
  });

  test("upgrades a bare user to member on an ACTIVE subscription, idempotently", async () => {
    const userId = await createTestUser("user");
    const subscriptionId = await createSubscription(userId, "ACTIVE");

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("active");
    expect(result.subscriptionId).toBe(subscriptionId);
    expect(result.previousRole).toBe("user");
    expect(result.role).toBe("member");
    expect(result.roleChanged).toBe(true);
    expect(await readRole(userId)).toBe("member");

    // Second run: nothing left to change.
    const again = await syncMemberStatusFromSubscription(userId);
    expect(again.roleChanged).toBe(false);
    expect(again.role).toBe("member");
    expect(await readRole(userId)).toBe("member");
  });

  test("writes the ROLE_CHANGE audit entry for the sync", async () => {
    const userId = await createTestUser("user");
    await createSubscription(userId, "ACTIVE");

    await syncMemberStatusFromSubscription(userId);

    const log = await db.query.authLog.findFirst({ where: eq(authLog.userId, userId) });
    expect(log?.eventType).toBe("ROLE_CHANGE");
    expect(log?.severity).toBe("INFO");
    expect(log?.message).toContain("derived member status: active");

    const metadata = log?.metadata as Record<string, unknown>;
    expect(metadata.previousRole).toBe("user");
    expect(metadata.newRole).toBe("member");
    expect(metadata.changedBy).toBe("system:membership-status-sync");
    expect(metadata.memberStatus).toBe("active");
  });

  test("keeps a specific member-tier role while entitled", async () => {
    const userId = await createTestUser("member_student");
    await createSubscription(userId, "ACTIVE");

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("active");
    expect(result.roleChanged).toBe(false);
    expect(result.role).toBe("member_student");
    expect(await readRole(userId)).toBe("member_student");
  });

  test("keeps membership through a canceled-but-paid-through grace period", async () => {
    const userId = await createTestUser("member");
    await createSubscription(userId, "CANCELED", {
      currentPeriodEnd: new Date(Date.now() + 10 * DAY),
    });

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("in_grace");
    expect(result.roleChanged).toBe(false);
    expect(await readRole(userId)).toBe("member");
  });

  test("downgrades a member when the canceled period has run out", async () => {
    const userId = await createTestUser("member");
    await createSubscription(userId, "CANCELED", {
      currentPeriodEnd: new Date(Date.now() - 1 * DAY),
    });

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("expired");
    expect(result.roleChanged).toBe(true);
    expect(result.role).toBe("user");
    expect(await readRole(userId)).toBe("user");
  });

  test("downgrades a member with no subscription row", async () => {
    const userId = await createTestUser("member");

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("none");
    expect(result.subscriptionId).toBeNull();
    expect(result.roleChanged).toBe(true);
    expect(result.role).toBe("user");
    expect(await readRole(userId)).toBe("user");
  });

  test("keeps membership through the PAST_DUE grace window", async () => {
    const userId = await createTestUser("member");
    await createSubscription(userId, "PAST_DUE", {
      currentPeriodEnd: new Date(Date.now() - 1 * DAY),
    });

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("in_grace");
    expect(result.roleChanged).toBe(false);
    expect(await readRole(userId)).toBe("member");
  });

  test("downgrades once the PAST_DUE grace window is over", async () => {
    const userId = await createTestUser("member");
    await createSubscription(userId, "PAST_DUE", {
      currentPeriodEnd: new Date(Date.now() - (PAST_DUE_GRACE_DAYS + 1) * DAY),
    });

    const result = await syncMemberStatusFromSubscription(userId);

    expect(result.memberStatus).toBe("expired");
    expect(result.roleChanged).toBe(true);
    expect(await readRole(userId)).toBe("user");
  });

  test("never touches privileged roles, in either direction", async () => {
    const adminId = await createTestUser("admin");
    await createSubscription(adminId, "ACTIVE");

    const adminResult = await syncMemberStatusFromSubscription(adminId);
    expect(adminResult.memberStatus).toBe("active");
    expect(adminResult.roleChanged).toBe(false);
    expect(await readRole(adminId)).toBe("admin");

    const moderatorId = await createTestUser("moderator");
    await createSubscription(moderatorId, "CANCELED", {
      currentPeriodEnd: new Date(Date.now() - 1 * DAY),
    });

    const moderatorResult = await syncMemberStatusFromSubscription(moderatorId);
    expect(moderatorResult.memberStatus).toBe("expired");
    expect(moderatorResult.roleChanged).toBe(false);
    expect(await readRole(moderatorId)).toBe("moderator");
  });
});
