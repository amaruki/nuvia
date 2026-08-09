/**
 * Dashboard overview aggregates (UI-01) — integration tests.
 *
 * Covers the real dashboard aggregates that replace the old fake dashboard
 * stats: member counts (derived status per ADR-0014), event counts, and the
 * finance overview (revenue via minor-unit sums per ADR-0015). Delta
 * assertions keep the suite safe on the shared test database.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, user } from "@/db/schema";
import {
  changePercent,
  getDashboardOverview,
  getEventOverviewStats,
  getFinanceOverviewStats,
  getMemberOverviewStats,
  type EventOverviewStats,
  type FinanceOverviewStats,
  type MemberOverviewStats,
} from "@/lib/services/dashboard-overview.service";
import { createDashboardFixture, type DashboardScenario } from "./finance-dashboard-api/fixtures";
import { createEventsReadFixtures } from "./events-read-api/helpers";

const financeFixture = createDashboardFixture();
const eventsFixture = createEventsReadFixtures();

/** Rows this suite seeds directly (users; subscriptions cascade). */
const seededUserIds: string[] = [];

const DAY_MS = 86_400_000;

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

/** A timestamp safely inside the previous UTC month (the 15th, 01:00 UTC). */
function lastMonthTimestamp(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15, 1, 0, 0));
}

async function seedUser(slug: string, createdAt?: Date): Promise<string> {
  const [row] = await db
    .insert(user)
    .values({
      username: `overview-${slug}-${crypto.randomUUID().slice(0, 8)}`,
      email: `overview-${slug}-${crypto.randomUUID().slice(0, 8)}@example.com`,
      name: `Overview ${slug}`,
      role: "user",
      ...(createdAt ? { createdAt } : {}),
    })
    .returning({ id: user.id });
  seededUserIds.push(row.id);
  return row.id;
}

let baselines: {
  members: MemberOverviewStats;
  events: EventOverviewStats;
  finance: FinanceOverviewStats;
};
let scenario: DashboardScenario | null = null;

beforeAll(async () => {
  const organizerId = await eventsFixture.createOrganizer("overview");
  const categoryId = await eventsFixture.createCategory("Overview");

  // Capture the shared-DB state BEFORE seeding anything, then assert deltas.
  baselines = {
    members: await getMemberOverviewStats(),
    events: await getEventOverviewStats(),
    finance: await getFinanceOverviewStats(),
  };

  scenario = await financeFixture.seed();

  // Members: one derived-active, one derived-expired, one without any
  // subscription, one that joined last month.
  const activeUserId = await seedUser("active-member");
  const expiredUserId = await seedUser("expired-member");
  await seedUser("no-subscription-member");
  await seedUser("last-month-member", lastMonthTimestamp());

  await db.insert(membershipSubscription).values([
    {
      userId: activeUserId,
      tierId: scenario.basicTierId,
      status: "ACTIVE",
      currentPeriodStart: daysFromNow(-5),
      currentPeriodEnd: daysFromNow(25),
    },
    {
      userId: expiredUserId,
      tierId: scenario.basicTierId,
      status: "ACTIVE",
      currentPeriodStart: daysFromNow(-40),
      currentPeriodEnd: daysFromNow(-10),
    },
  ]);

  // Events: two upcoming published (one within 7 days), one past, one draft,
  // one canceled — only the two published future events count as upcoming.
  await eventsFixture.createEvent(organizerId, categoryId, {
    title: `Overview Upcoming Soon ${crypto.randomUUID()}`,
    startTime: daysFromNow(2),
    endTime: daysFromNow(2.1),
    status: "PUBLISHED",
  });
  await eventsFixture.createEvent(organizerId, categoryId, {
    title: `Overview Upcoming Later ${crypto.randomUUID()}`,
    startTime: daysFromNow(30),
    endTime: daysFromNow(30.1),
    status: "PUBLISHED",
  });
  await eventsFixture.createEvent(organizerId, categoryId, {
    title: `Overview Past ${crypto.randomUUID()}`,
    startTime: daysFromNow(-3),
    endTime: daysFromNow(-2.9),
    status: "COMPLETED",
  });
  await eventsFixture.createEvent(organizerId, categoryId, {
    title: `Overview Draft ${crypto.randomUUID()}`,
    startTime: daysFromNow(3),
    endTime: daysFromNow(3.1),
    status: "DRAFT",
  });
  await eventsFixture.createEvent(organizerId, categoryId, {
    title: `Overview Canceled ${crypto.randomUUID()}`,
    startTime: daysFromNow(4),
    endTime: daysFromNow(4.1),
    status: "CANCELED",
  });
});

afterAll(async () => {
  if (seededUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, seededUserIds));
  }
  await financeFixture.cleanup();
  await eventsFixture.cleanup();
});

describe("changePercent (pure helper)", () => {
  test("computes growth from minor-unit amounts", () => {
    expect(changePercent(1500, 1000)).toBe(50);
    expect(changePercent(800, 1000)).toBe(-20);
    expect(changePercent(1234, 1000)).toBe(23.4);
  });

  test("returns null when there is no previous period to compare against", () => {
    expect(changePercent(500, 0)).toBeNull();
  });
});

describe("getMemberOverviewStats", () => {
  test("counts totals, derived-active, derived-expired, and new members", async () => {
    const after = await getMemberOverviewStats();

    // Four users seeded directly + two fixture members.
    expect(after.totalMembers - baselines.members.totalMembers).toBeGreaterThanOrEqual(6);
    expect(after.activeMembers - baselines.members.activeMembers).toBeGreaterThanOrEqual(1);
    expect(after.expiredMemberships - baselines.members.expiredMemberships).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      after.newMembersThisMonth - baselines.members.newMembersThisMonth,
    ).toBeGreaterThanOrEqual(5);
    expect(
      after.newMembersLastMonth - baselines.members.newMembersLastMonth,
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("getEventOverviewStats", () => {
  test("counts total, upcoming, and next-7-day events", async () => {
    const after = await getEventOverviewStats();

    expect(after.totalEvents - baselines.events.totalEvents).toBeGreaterThanOrEqual(5);
    expect(after.upcomingEvents - baselines.events.upcomingEvents).toBeGreaterThanOrEqual(2);
    expect(after.eventsThisWeek - baselines.events.eventsThisWeek).toBeGreaterThanOrEqual(1);
  });
});

describe("getFinanceOverviewStats", () => {
  test("aggregates revenue, outstanding invoices, and subscriptions", async () => {
    const after = await getFinanceOverviewStats();

    // Completed transactions this month: 10.00 + 15.00 = 2500 minor units.
    expect(
      toMinor(after.monthlyRevenue) - toMinor(baselines.finance.monthlyRevenue),
    ).toBeGreaterThanOrEqual(2500);
    // Completed transaction last month: 5.00 = 500 minor units.
    expect(
      toMinor(after.previousMonthRevenue) - toMinor(baselines.finance.previousMonthRevenue),
    ).toBeGreaterThanOrEqual(500);
    expect(
      toMinor(after.totalRevenue) - toMinor(baselines.finance.totalRevenue),
    ).toBeGreaterThanOrEqual(3000);
    // Outstanding: 10.00 remaining on invoice B + 25.00 on invoice C.
    expect(
      toMinor(after.pendingPayments) - toMinor(baselines.finance.pendingPayments),
    ).toBeGreaterThanOrEqual(3500);
    // Overdue: 25.00 on invoice C (due yesterday).
    expect(
      toMinor(after.overduePayments) - toMinor(baselines.finance.overduePayments),
    ).toBeGreaterThanOrEqual(2500);
    // Fixture subscriptions A + B are ACTIVE with current periods.
    expect(
      after.activeSubscriptions - baselines.finance.activeSubscriptions,
    ).toBeGreaterThanOrEqual(2);
    expect(
      after.newSubscriptionsThisMonth - baselines.finance.newSubscriptionsThisMonth,
    ).toBeGreaterThanOrEqual(2);
  });

  test("monthly revenue change stays consistent with the period amounts", async () => {
    const stats = await getFinanceOverviewStats();
    const current = toMinor(stats.monthlyRevenue);
    const previous = toMinor(stats.previousMonthRevenue);
    // The shared test DB may hold more last-month than this-month revenue
    // from other suites, so assert the consistency contract, not the sign.
    const expected =
      previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;
    expect(stats.monthlyRevenueChangePercent).toBe(expected);
  });
});

describe("getDashboardOverview", () => {
  test("composes member, event, and finance sections", async () => {
    const overview = await getDashboardOverview();

    expect(overview.members.totalMembers).toBeGreaterThanOrEqual(1);
    expect(overview.events.totalEvents).toBeGreaterThanOrEqual(1);
    expect(typeof overview.finance.totalRevenue).toBe("string");
    expect(typeof overview.finance.activeSubscriptions).toBe("number");
  });
});

function toMinor(amount: string): number {
  const [major, fraction = ""] = amount.split(".");
  return Number(major) * 100 + Number(fraction.padEnd(2, "0"));
}
