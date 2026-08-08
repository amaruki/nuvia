/**
 * B1 — Members on real data.
 *
 * Service-level coverage for the member directory (listMembers,
 * getMemberDetail) against the shared test database. Fixtures are created in
 * beforeAll and cleaned up in afterAll, so the suite is self-contained.
 *
 * The derived member status must match the A3 derivation (ADR-0014): the
 * service imports `deriveMemberStatus`; these tests assert the derivation's
 * outcome for active, canceled (in grace / expired), past_due (in grace /
 * expired), paused, trialing and no-subscription users end to end.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, membershipTier, user } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { getMemberDetail, listMembers } from "@/lib/services/member.service";
import type { MemberStatus } from "@/lib/services/membership-status.service";
import { GET as listMembersRoute } from "@/app/api/v1/members/route";
import { GET as memberDetailRoute } from "@/app/api/v1/members/[id]/route";
const DAY = 86_400_000;
const daysFromNow = (days: number): Date => new Date(Date.now() + days * DAY);

const stamp = `${Date.now()}${Math.random().toString(36).slice(2)}`;
/** Unique per run; every fixture username/email/name contains it, which lets
 * the search filter scope all assertions to this suite's cohort. */
const COHORT = `b1mem${stamp}`;
const TIER_NAME = `b1-tier-${stamp}`;

const createdUserIds: string[] = [];
let tierId: string;

type NewSubscription = typeof membershipSubscription.$inferInsert;

interface CohortMember {
  slug: string;
  role: string;
  deleted?: boolean;
}

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

/** slug -> user id, filled in beforeAll. */
const ids: Record<string, string> = {};

/** The A3 (ADR-0014) expectation for each fixture, asserted below. */
const expectedStatus: Record<string, MemberStatus> = {
  active: "active", // ACTIVE inside the paid period
  gracecancel: "in_grace", // CANCELED but paid through the period
  lapsedcancel: "expired", // CANCELED and the paid period is over
  pastduefresh: "in_grace", // PAST_DUE inside the retry grace window
  pastdueold: "expired", // PAST_DUE past the retry grace window
  trial: "trialing", // TRIALING inside the trial window
  paused: "paused", // PAUSED
  nosub: "none", // no subscription row at all
  renewed: "active", // newest subscription is ACTIVE; older CANCELED one loses
};

beforeAll(async () => {
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
});

afterAll(async () => {
  // Subscriptions cascade off the user rows; the tier row is removed last,
  // once nothing references it anymore.
  for (const id of createdUserIds) {
    await db.delete(user).where(eq(user.id, id));
  }
  await db.delete(membershipTier).where(eq(membershipTier.id, tierId));
});

describe("listMembers — derived status matches the A3 derivation", () => {
  test("every fixture derives its ADR-0014 status; soft-deleted users are excluded", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });

    expect(result.total).toBe(9);
    expect(result.totalPages).toBe(1);
    expect(result.members).toHaveLength(9);

    for (const member of result.members) {
      const slug = member.username.replace(`${COHORT}-`, "");
      expect(expectedStatus[slug]).toBeDefined();
      expect(member.memberStatus).toBe(expectedStatus[slug]);
    }
    expect(
      result.members.some((member) => member.username.endsWith("-deleted")),
    ).toBe(false);
  });

  test("list items expose the newest subscription with its tier name", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-active`,
    });
    expect(result.total).toBe(1);

    const [member] = result.members;
    expect(member.subscription).not.toBeNull();
    expect(member.subscription?.status).toBe("ACTIVE");
    expect(member.subscription?.tierName).toBe(TIER_NAME);
    expect(member.email).toBe(`${COHORT}-active@example.test`);
  });

  test("users without a subscription list with subscription null and status none", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-nosub`,
    });
    expect(result.total).toBe(1);
    expect(result.members[0].memberStatus).toBe("none");
    expect(result.members[0].subscription).toBeNull();
  });

  test("a renewed user's listing uses the newest subscription", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-renewed`,
    });
    expect(result.total).toBe(1);
    expect(result.members[0].memberStatus).toBe("active");
    expect(result.members[0].subscription?.status).toBe("ACTIVE");
  });
});

describe("listMembers — search, role and status filters", () => {
  test("search matches name fragments", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `B1 ${COHORT}`,
    });
    expect(result.total).toBe(9);
  });

  test("search matches email fragments", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-active@`,
    });
    expect(result.total).toBe(1);
    expect(result.members[0].username).toBe(`${COHORT}-active`);
  });

  test("role filter narrows to matching roles", async () => {
    const userOnly = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      roles: ["user"],
    });
    expect(userOnly.total).toBe(1);
    expect(userOnly.members[0].username).toBe(`${COHORT}-nosub`);

    const memberAndUser = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      roles: ["member", "user"],
    });
    expect(memberAndUser.total).toBe(9);

    const admins = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      roles: ["admin"],
    });
    expect(admins.total).toBe(0);
  });

  test("memberStatus filter is evaluated on the derived status", async () => {
    const cases: Array<[MemberStatus[], string[]]> = [
      [["active"], ["active", "renewed"]],
      [["in_grace"], ["gracecancel", "pastduefresh"]],
      [["expired"], ["lapsedcancel", "pastdueold"]],
      [["trialing"], ["trial"]],
      [["paused"], ["paused"]],
      [["none"], ["nosub"]],
      [
        ["active", "trialing"],
        ["active", "renewed", "trial"],
      ],
    ];

    for (const [statuses, slugs] of cases) {
      const result = await listMembers({
        page: 1,
        limit: 100,
        search: COHORT,
        memberStatuses: statuses,
      });
      expect(result.total).toBe(slugs.length);
      const got = result.members
        .map((member) => member.username.replace(`${COHORT}-`, ""))
        .sort();
      expect(got).toEqual([...slugs].sort());
    }
  });

  test("memberStatus filter pages correctly", async () => {
    const pageOne = await listMembers({
      page: 1,
      limit: 1,
      search: COHORT,
      memberStatuses: ["active"],
      sortBy: "username",
      sortOrder: "asc",
    });
    expect(pageOne.total).toBe(2);
    expect(pageOne.totalPages).toBe(2);
    expect(pageOne.members).toHaveLength(1);

    const pageTwo = await listMembers({
      page: 2,
      limit: 1,
      search: COHORT,
      memberStatuses: ["active"],
      sortBy: "username",
      sortOrder: "asc",
    });
    expect(pageTwo.members).toHaveLength(1);
    expect(pageTwo.members[0].id).not.toBe(pageOne.members[0].id);
  });
});

describe("listMembers — pagination", () => {
  test("limit/page slice the cohort without overlap or gaps", async () => {
    const pageOne = await listMembers({
      page: 1,
      limit: 4,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });
    const pageTwo = await listMembers({
      page: 2,
      limit: 4,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });
    const pageThree = await listMembers({
      page: 3,
      limit: 4,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });

    expect(pageOne.total).toBe(9);
    expect(pageOne.totalPages).toBe(3);
    expect(pageOne.members).toHaveLength(4);
    expect(pageTwo.members).toHaveLength(4);
    expect(pageThree.members).toHaveLength(1);

    const idsAcrossPages = [
      ...pageOne.members,
      ...pageTwo.members,
      ...pageThree.members,
    ].map((member) => member.id);
    expect(new Set(idsAcrossPages).size).toBe(9);
  });

  test("limit clamps to 100 and invalid pagination falls back to defaults", async () => {
    const clamped = await listMembers({ page: 1, limit: 500, search: COHORT });
    expect(clamped.limit).toBe(100);

    const invalid = await listMembers({
      page: Number.NaN,
      limit: Number.NaN,
      search: COHORT,
    });
    expect(invalid.page).toBe(1);
    expect(invalid.limit).toBe(20);
  });

  test("sort direction changes ordering", async () => {
    const asc = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });
    const desc = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      sortBy: "username",
      sortOrder: "desc",
    });
    expect(asc.members[0].id).toBe(desc.members[desc.members.length - 1].id);
  });
});

describe("getMemberDetail — user block, derived status, subscription history", () => {
  test("renewed member: history is newest-first and status comes from the newest row", async () => {
    const detail = await getMemberDetail(ids.renewed);

    expect(detail.user.id).toBe(ids.renewed);
    expect(detail.user.email).toBe(`${COHORT}-renewed@example.test`);
    expect(detail.user.role).toBe("member");
    expect(detail.memberStatus).toBe("active");

    expect(detail.subscriptionHistory).toHaveLength(2);
    expect(detail.subscriptionHistory[0].status).toBe("ACTIVE");
    expect(detail.subscriptionHistory[1].status).toBe("CANCELED");
    expect(detail.currentSubscription?.id).toBe(
      detail.subscriptionHistory[0].id,
    );
    expect(detail.subscriptionHistory[0].tierName).toBe(TIER_NAME);
  });

  test("user without subscriptions: none status, empty history", async () => {
    const detail = await getMemberDetail(ids.nosub);
    expect(detail.memberStatus).toBe("none");
    expect(detail.currentSubscription).toBeNull();
    expect(detail.subscriptionHistory).toEqual([]);
  });

  test("canceled-but-paid-through member derives in_grace", async () => {
    const detail = await getMemberDetail(ids.gracecancel);
    expect(detail.memberStatus).toBe("in_grace");
    expect(detail.currentSubscription?.status).toBe("CANCELED");
  });

  test("unknown user id throws NotFoundError", async () => {
    await expect(getMemberDetail(crypto.randomUUID())).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  test("soft-deleted user throws NotFoundError", async () => {
    await expect(getMemberDetail(ids.deleted)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("members routes — authorization gate (RFC 9457)", () => {
  test("GET /api/v1/members rejects unauthenticated requests", async () => {
    const response = await listMembersRoute(
      new Request("http://localhost/api/v1/members") as never,
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json",
    );
    const body = await response.json();
    expect(body.status).toBe(401);
    expect(body.type).toContain("/problems/authentication-required");
  });

  test("GET /api/v1/members/[id] rejects unauthenticated requests", async () => {
    const response = await memberDetailRoute(
      new Request("http://localhost/api/v1/members/x") as never,
      {
        params: Promise.resolve({ id: crypto.randomUUID() }),
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json",
    );
    const body = await response.json();
    expect(body.status).toBe(401);
  });
});
