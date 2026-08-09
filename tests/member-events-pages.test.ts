/**
 * UI-23 subset — the four former stub pages are real, read-only surfaces:
 *
 *   src/app/dashboard/events/pricing/page.tsx
 *   src/app/dashboard/events/certificates/page.tsx
 *   src/app/dashboard/memberships/analytics/page.tsx
 *   src/app/dashboard/memberships/renewals/page.tsx
 *
 * Source-level assertions pin the wiring (server shells stay hook-free, the
 * client islands own "use client", services are the data path, nothing is
 * fabricated). DB-backed sections run against the local Postgres stack with
 * RUN_ID-tagged fixtures and measure exactly what this run adds, so the
 * suite is baseline-delta and safe alongside concurrent test files.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, like } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventCategory, membershipSubscription, membershipTier, user } from "@/db/schema";
import { getEventPricingOverview } from "@/lib/services/event-pricing-read";
import { getMembershipAnalytics } from "@/lib/services/membership-analytics-read";
import {
  classifyForRenewal,
  getRenewalQueue,
  RENEWAL_WINDOW_DAYS,
} from "@/lib/services/membership-renewals-read";

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const read = (relPath: string): string => readFileSync(join(process.cwd(), relPath), "utf8");

const PAGES = {
  pricing: "src/app/dashboard/events/pricing/page.tsx",
  certificates: "src/app/dashboard/events/certificates/page.tsx",
  analytics: "src/app/dashboard/memberships/analytics/page.tsx",
  renewals: "src/app/dashboard/memberships/renewals/page.tsx",
} as const;

// ---------------------------------------------------------------------------
// Source-level wiring
// ---------------------------------------------------------------------------

describe("UI-23 pages are real server components", () => {
  for (const [name, relPath] of Object.entries(PAGES)) {
    test(`${name} shell is server-first and permission-gated`, () => {
      const source = read(relPath);
      expect(source).not.toContain('"use client"');
      expect(source).not.toContain("'use client'");
      // No client hooks or handlers may live in the shell.
      for (const marker of ["useState(", "useEffect(", "useMemo(", "onClick=", "onChange="]) {
        expect(source).not.toContain(marker);
      }
      // Gate mirrors the nav roles (single source of truth) + login redirect.
      expect(source).toContain('from "@/lib/dashboard-access"');
      expect(source).toContain("isRoleAllowedForPath");
      expect(source).toContain('from "@/lib/rbac"');
      expect(source).toContain('redirect("/auth/login")');
      expect(source).toContain('export const dynamic = "force-dynamic"');
      // Stub is gone: real content, not a bare h1.
      expect(source.length).toBeGreaterThan(2000);
    });
  }

  test("pricing page reads event aggregates and tier pricing", () => {
    const page = read(PAGES.pricing);
    expect(page).toContain('from "@/lib/services/event-pricing-read"');
    expect(page).toContain("getEventPricingOverview");
    expect(page).toContain("listTiers");
    expect(page).toContain("countActiveMembersByTier");
    expect(page).toContain("getOrganization");

    const service = read("src/lib/services/event-pricing-read.ts");
    expect(service).toContain('from "@/db/schema"');
    expect(service).toContain("groupBy(event.price, event.currency)");
    // Honest about the unmodeled dimension instead of inventing one.
    expect(page).toMatch(/promo code/i);

    const island = read(
      "src/app/dashboard/events/pricing/_components/price-distribution-chart.tsx",
    );
    expect(island.startsWith('"use client"')).toBe(true);
    expect(island).toContain("ChartContainer");
    expect(island).toContain("var(--chart-1)");
  });

  test("certificates page shows only the viewer's own ACTIVE certificates", () => {
    const page = read(PAGES.certificates);
    expect(page).toContain('from "@/lib/services/learning/certificate-queries"');
    expect(page).toContain("listCertificatesForStudent(currentUser.email)");
    // Verify link targets the public verification route with the stored code.
    expect(page).toContain("/certificates/verify/${certificate.verificationCode}");
    expect(page).toContain("/certificates/${certificate.id}");
    // No fabricated certificate codes.
    expect(page).not.toMatch(/verify\/[A-Z0-9]{6,}/);
  });

  test("analytics page renders server data through chart islands", () => {
    const page = read(PAGES.analytics);
    expect(page).toContain('from "@/lib/services/membership-analytics-read"');
    expect(page).toContain("getMembershipAnalytics");

    const service = read("src/lib/services/membership-analytics-read.ts");
    // Same derivation as the member directory — status is never stored.
    expect(service).toContain("derivedMemberStatusSql");
    expect(service).toContain("latestSubscriptionPerUser");

    for (const island of ["growth-chart.tsx", "status-chart.tsx", "tier-chart.tsx"]) {
      const source = read(`src/app/dashboard/memberships/analytics/_components/${island}`);
      expect(source.startsWith('"use client"')).toBe(true);
      expect(source).toContain("ChartContainer");
      expect(source).toContain("var(--chart-");
      // Islands render props only — no local datasets.
      expect(source).not.toMatch(/\bconst\s+\w*(data|members|rows)\w*\s*=\s*\[/i);
    }
  });

  test("renewals page renders the admin queue from stored subscription fields", () => {
    const page = read(PAGES.renewals);
    expect(page).toContain('from "@/lib/services/membership-renewals-read"');
    expect(page).toContain("getRenewalQueue");

    const service = read("src/lib/services/membership-renewals-read.ts");
    // Built on the finance subscriptions read path, not a private query.
    expect(service).toContain('from "@/lib/services/subscription.service"');
    expect(service).toContain("listSubscriptions");
    expect(service).toContain("cancelAtPeriodEnd");
    expect(service).toContain("currentPeriodEnd");
  });

  test("no fabricated data anywhere in the four surfaces", () => {
    const files = [
      ...Object.values(PAGES),
      "src/app/dashboard/events/pricing/_components/helpers.ts",
      "src/app/dashboard/events/pricing/_components/price-distribution-chart.tsx",
      "src/app/dashboard/memberships/analytics/_components/helpers.ts",
      "src/app/dashboard/memberships/analytics/_components/growth-chart.tsx",
      "src/app/dashboard/memberships/analytics/_components/status-chart.tsx",
      "src/app/dashboard/memberships/analytics/_components/tier-chart.tsx",
      "src/app/dashboard/memberships/renewals/_components/helpers.ts",
    ];
    for (const relPath of files) {
      const source = read(relPath);
      expect(source).not.toMatch(/\b(mock|fake|dummy|placeholder|lorem)\b/i);
      expect(source).not.toContain("Math.random");
    }
  });
});

// ---------------------------------------------------------------------------
// Renewal bucketing semantics (pure)
// ---------------------------------------------------------------------------

describe("classifyForRenewal", () => {
  const now = new Date("2026-02-15T12:00:00Z");
  const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

  test("past-due and unpaid always surface", () => {
    expect(
      classifyForRenewal(
        { status: "PAST_DUE", currentPeriodEnd: days(30), cancelAtPeriodEnd: false },
        now,
      ),
    ).toBe("past_due");
    expect(
      classifyForRenewal(
        { status: "UNPAID", currentPeriodEnd: null, cancelAtPeriodEnd: false },
        now,
      ),
    ).toBe("past_due");
  });

  test("cancel-at-period-end with a live period is wont_renew", () => {
    expect(
      classifyForRenewal(
        { status: "ACTIVE", currentPeriodEnd: days(40), cancelAtPeriodEnd: true },
        now,
      ),
    ).toBe("wont_renew");
    // Period already gone — nothing left to renew.
    expect(
      classifyForRenewal(
        { status: "ACTIVE", currentPeriodEnd: days(-1), cancelAtPeriodEnd: true },
        now,
      ),
    ).toBeNull();
  });

  test("canceled rows are in grace only while the paid period lives", () => {
    expect(
      classifyForRenewal(
        { status: "CANCELED", currentPeriodEnd: days(5), cancelAtPeriodEnd: false },
        now,
      ),
    ).toBe("in_grace");
    expect(
      classifyForRenewal(
        { status: "CANCELED", currentPeriodEnd: days(-1), cancelAtPeriodEnd: false },
        now,
      ),
    ).toBeNull();
  });

  test("active/trialing rows bucket by period distance", () => {
    expect(
      classifyForRenewal(
        { status: "ACTIVE", currentPeriodEnd: days(-3), cancelAtPeriodEnd: false },
        now,
      ),
    ).toBe("lapsed");
    expect(
      classifyForRenewal(
        { status: "ACTIVE", currentPeriodEnd: days(10), cancelAtPeriodEnd: false },
        now,
      ),
    ).toBe("expiring_soon");
    expect(
      classifyForRenewal(
        {
          status: "TRIALING",
          currentPeriodEnd: days(RENEWAL_WINDOW_DAYS),
          cancelAtPeriodEnd: false,
        },
        now,
      ),
    ).toBe("expiring_soon");
    // Beyond the window — not yet actionable.
    expect(
      classifyForRenewal(
        {
          status: "ACTIVE",
          currentPeriodEnd: days(RENEWAL_WINDOW_DAYS + 1),
          cancelAtPeriodEnd: false,
        },
        now,
      ),
    ).toBeNull();
    // Lifetime membership — nothing renews.
    expect(
      classifyForRenewal(
        { status: "ACTIVE", currentPeriodEnd: null, cancelAtPeriodEnd: false },
        now,
      ),
    ).toBeNull();
    // Paused rows are held, not renewal targets.
    expect(
      classifyForRenewal(
        { status: "PAUSED", currentPeriodEnd: days(2), cancelAtPeriodEnd: false },
        now,
      ),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// DB-backed reads against the local Postgres stack
// ---------------------------------------------------------------------------

const createdUserIds: string[] = [];
const createdTierIds: string[] = [];
const createdCategoryIds: string[] = [];

async function createTestUser(label: string): Promise<string> {
  const [row] = await db
    .insert(user)
    .values({
      username: `ui23-${label}-${RUN_ID}`,
      email: `ui23-${label}-${RUN_ID}@example.test`,
      name: `UI23 ${label} ${RUN_ID}`,
      role: "user",
      emailVerified: false,
    })
    .returning({ id: user.id });
  createdUserIds.push(row.id);
  return row.id;
}

async function createTier(label: string): Promise<string> {
  const [row] = await db
    .insert(membershipTier)
    .values({
      name: `ui23-${label}-${RUN_ID}`,
      displayName: `UI23 ${label} ${RUN_ID}`,
      price: "10.00",
      billingCycle: "monthly",
      features: [],
      benefits: [],
      permissions: [],
      isActive: true,
    })
    .returning({ id: membershipTier.id });
  createdTierIds.push(row.id);
  return row.id;
}

afterAll(async () => {
  // Order respects FKs: events reference category + creator, subscriptions
  // cascade off users, tiers last.
  await db.delete(event).where(like(event.title, `%${RUN_ID}%`));
  for (const id of createdUserIds) {
    await db.delete(user).where(eq(user.id, id));
  }
  for (const id of createdTierIds) {
    await db.delete(membershipTier).where(eq(membershipTier.id, id));
  }
  for (const id of createdCategoryIds) {
    await db.delete(eventCategory).where(eq(eventCategory.id, id));
  }
});

describe("renewal queue (DB-backed)", () => {
  test("buckets real subscription rows and enriches member/tier names", async () => {
    const now = new Date();
    const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

    const userId = await createTestUser("renewals");
    const tierId = await createTier("renewals");
    const [userRow] = await db
      .select({ name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, userId));

    const fixtures: Array<{
      label: string;
      status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "UNPAID" | "CANCELED";
      periodEnd: Date | null;
      cancelAtPeriodEnd?: boolean;
    }> = [
      { label: "pastdue", status: "PAST_DUE", periodEnd: days(10) },
      { label: "lapsed", status: "ACTIVE", periodEnd: days(-3) },
      { label: "expiring", status: "ACTIVE", periodEnd: days(10) },
      { label: "wontrenew", status: "ACTIVE", periodEnd: days(40), cancelAtPeriodEnd: true },
      { label: "ingrace", status: "CANCELED", periodEnd: days(5) },
      { label: "farfuture", status: "ACTIVE", periodEnd: days(200) },
    ];

    const subscriptionIds: string[] = [];
    for (const fixture of fixtures) {
      const [row] = await db
        .insert(membershipSubscription)
        .values({
          userId,
          tierId,
          status: fixture.status,
          currentPeriodStart: days(-20),
          currentPeriodEnd: fixture.periodEnd,
          cancelAtPeriodEnd: fixture.cancelAtPeriodEnd ?? false,
          canceledAt: fixture.status === "CANCELED" ? days(-1) : null,
        })
        .returning({ id: membershipSubscription.id });
      subscriptionIds.push(row.id);
    }

    const queue = await getRenewalQueue(now);
    const byId = new Map(queue.items.map((item) => [item.subscriptionId, item]));

    expect(byId.get(subscriptionIds[0])?.bucket).toBe("past_due");
    expect(byId.get(subscriptionIds[1])?.bucket).toBe("lapsed");
    expect(byId.get(subscriptionIds[2])?.bucket).toBe("expiring_soon");
    expect(byId.get(subscriptionIds[3])?.bucket).toBe("wont_renew");
    expect(byId.get(subscriptionIds[4])?.bucket).toBe("in_grace");
    // Beyond the window and healthy — honestly excluded.
    expect(byId.has(subscriptionIds[5])).toBe(false);

    // Counts reflect at least this run's rows (shared DB → baseline-delta).
    expect(queue.counts.past_due).toBeGreaterThanOrEqual(1);
    expect(queue.counts.lapsed).toBeGreaterThanOrEqual(1);
    expect(queue.counts.expiring_soon).toBeGreaterThanOrEqual(1);
    expect(queue.counts.wont_renew).toBeGreaterThanOrEqual(1);
    expect(queue.counts.in_grace).toBeGreaterThanOrEqual(1);
    expect(queue.windowDays).toBe(RENEWAL_WINDOW_DAYS);

    // Enrichment carries the stored member and tier facts.
    const item = byId.get(subscriptionIds[2]);
    expect(item?.memberEmail).toBe(userRow.email);
    expect(item?.memberName).toBe(userRow.name);
    expect(item?.tierLabel).toBe(`UI23 renewals ${RUN_ID}`);
  });
});

describe("membership analytics (DB-backed)", () => {
  test("a new ACTIVE subscription moves status, growth and tier slices", async () => {
    const now = new Date();
    const before = await getMembershipAnalytics(now);

    const userId = await createTestUser("analytics");
    const tierId = await createTier("analytics");
    await db.insert(membershipSubscription).values({
      userId,
      tierId,
      status: "ACTIVE",
      currentPeriodStart: new Date(now.getTime() - 5 * 86_400_000),
      currentPeriodEnd: new Date(now.getTime() + 25 * 86_400_000),
    });

    const after = await getMembershipAnalytics(now);

    expect(after.totalAccounts).toBe(before.totalAccounts + 1);
    expect(after.statusCounts.active).toBe(before.statusCounts.active + 1);
    expect(after.totalActiveSubscriptions).toBe(before.totalActiveSubscriptions + 1);

    const monthNow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const beforePoint = before.monthlyGrowth.find((point) => point.month === monthNow);
    const afterPoint = after.monthlyGrowth.find((point) => point.month === monthNow);
    expect(afterPoint?.newMembers).toBe((beforePoint?.newMembers ?? 0) + 1);
    // Trailing 12 months including the current one.
    expect(after.monthlyGrowth).toHaveLength(12);

    const slice = after.tierDistribution.find((tier) => tier.tierId === tierId);
    expect(slice?.activeSubscriptions).toBe(1);
    expect(slice?.tierLabel).toBe(`UI23 analytics ${RUN_ID}`);
  });
});

describe("event pricing overview (DB-backed)", () => {
  test("free/paid flags and price points reflect created events", async () => {
    const before = await getEventPricingOverview();

    const creatorId = await createTestUser("pricing");
    const [category] = await db
      .insert(eventCategory)
      .values({ name: `ui23-category-${RUN_ID}` })
      .returning({ id: eventCategory.id });
    createdCategoryIds.push(category.id);

    const baseEvent = {
      categoryId: category.id,
      createdBy: creatorId,
      type: "CONFERENCE" as const,
      format: "IN_PERSON" as const,
      status: "PUBLISHED" as const,
      visibility: "PUBLIC" as const,
      timezone: "UTC",
      startTime: new Date(Date.now() + 30 * 86_400_000),
      endTime: new Date(Date.now() + 31 * 86_400_000),
    };

    await db.insert(event).values([
      {
        ...baseEvent,
        title: `ui23-free-${RUN_ID}`,
        slug: `ui23-free-${RUN_ID}`,
        isFree: true,
        price: null,
      },
      {
        ...baseEvent,
        title: `ui23-paid-a-${RUN_ID}`,
        slug: `ui23-paid-a-${RUN_ID}`,
        isFree: false,
        price: "25.00",
        currency: "USD",
      },
      {
        ...baseEvent,
        title: `ui23-paid-b-${RUN_ID}`,
        slug: `ui23-paid-b-${RUN_ID}`,
        isFree: false,
        price: "25.00",
        currency: "USD",
      },
      {
        ...baseEvent,
        title: `ui23-paid-c-${RUN_ID}`,
        slug: `ui23-paid-c-${RUN_ID}`,
        isFree: false,
        price: "100.00",
        currency: "USD",
      },
    ]);

    const after = await getEventPricingOverview();

    // Baseline-delta: concurrent suites may add their own rows, so assert at
    // least this run's contribution.
    expect(after.totalEvents).toBeGreaterThanOrEqual(before.totalEvents + 4);
    expect(after.freeEvents).toBeGreaterThanOrEqual(before.freeEvents + 1);
    expect(after.paidEvents).toBeGreaterThanOrEqual(before.paidEvents + 3);
    expect(after.pricedEvents).toBeGreaterThanOrEqual(before.pricedEvents + 3);

    const beforePoint = before.pricePoints.find((p) => p.price === "25.00" && p.currency === "USD");
    const afterPoint = after.pricePoints.find((p) => p.price === "25.00" && p.currency === "USD");
    expect(afterPoint?.eventCount).toBeGreaterThanOrEqual((beforePoint?.eventCount ?? 0) + 2);

    // The created rows are exactly what the read reports (RUN_ID isolation).
    const ownRows = await db
      .select({ isFree: event.isFree })
      .from(event)
      .where(like(event.title, `%${RUN_ID}%`));
    expect(ownRows).toHaveLength(4);
    expect(ownRows.filter((row) => row.isFree)).toHaveLength(1);
  });
});
