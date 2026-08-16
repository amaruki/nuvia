/**
 * UI-32 — Member announcement outlets (decision D11: the content module owns
 * announcements).
 *
 * Exercises src/lib/services/content/member-announcements.ts against the
 * shared test database (DATABASE_URL from .env). These read paths are the
 * security boundary for the member inbox (/dashboard/announcements) and the
 * event-page announcement banner — they run outside the content:read-gated
 * admin API, so this suite pins down the exposure contract from the planning
 * doc's per-module matrix row for Content:
 *
 *   - inbox: only ANNOUNCEMENT rows that are status PUBLISHED, visibility
 *     MEMBERS_ONLY or wider (i.e. PUBLIC), and publishedAt <= now surface;
 *     DRAFT / ARCHIVED / DELETED / SCHEDULED / future-published rows and
 *     narrower visibilities (PREMIUM_MEMBERS, SPECIFIC_ROLES, PRIVATE) never
 *     do; non-announcement content types never do;
 *   - banner: the same audience gate (narrowed to PUBLIC for anonymous
 *     viewers), plus event targeting via metadata.ui.targetEventId and
 *     expiry via metadata.ui.expiresAt — the closest real mechanism to a
 *     targeting column, which the schema does not have (gap reported; no
 *     schema change this wave);
 *   - both projections are exact member-safe allow-lists (no email, no
 *     internal status/visibility, no metadata blob);
 *   - inbox pagination (page/limit/total), ordering (newest first), and
 *     input clamping behave.
 *
 * Fixtures follow the tests/news-public-read.test.ts pattern: a RUN_ID
 * name-isolates every row this file creates and cleanup() removes them in
 * FK order (content before users), so the file is self-cleaning against the
 * shared database. Rows are seeded through drizzle directly (no session is
 * needed for a read-path test); banner fixtures seed metadata.ui directly —
 * exactly the write path the backoffice does not have yet (the gap).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";
import { db } from "@/db/client";
import { content, membershipSubscription, membershipTier, user } from "@/db/schema";
import {
  listEventAnnouncements,
  listMemberAnnouncements,
  type MemberAnnouncement,
} from "@/lib/services/content/member-announcements";
import { getLatestAnnouncement } from "@/lib/services/member/home";

// ── Fixtures ────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const HOUR = 3_600_000;

type ContentInsert = typeof content.$inferInsert;

/** Fields that must never appear in a member-facing projection, by name. */
const NEVER_PUBLIC_FIELDS = [
  "email",
  "authorEmail",
  "author_email",
  "status",
  "visibility",
  "metadata",
  "authorId",
  "categoryId",
  "createdAt",
  "updatedAt",
];

/** Synthetic event ids: the banner read path keys on the targeting slot in
 * metadata.ui, so no events-table rows are needed to prove the filter. */
let EVENT_A: string;
let EVENT_B: string;

function createFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const userIds: string[] = [];
  const contentIds: string[] = [];
  const tierIds: string[] = [];
  const authors: Record<string, { id: string; name: string; email: string }> = {};
  const rows: Record<string, typeof content.$inferSelect> = {};
  /**
   * Issue #23 viewer: a user with an ACTIVE subscription — the only viewer
   * entitled to MEMBERS_ONLY rows. Deleting the user cascades the
   * subscription row.
   */
  let memberViewerId: string | null = null;

  async function seedAuthor(label: string) {
    const name = `UI-32 Author ${label} ${RUN_ID}`;
    const email = `ui32-${label}-${RUN_ID}@example.test`;
    const [row] = await db
      .insert(user)
      .values({
        username: `ui32-${label}-${RUN_ID}`,
        email,
        name,
        role: "user",
      })
      .returning();
    userIds.push(row.id);
    authors[label] = { id: row.id, name, email };
    return row;
  }

  async function seedContent(label: string, overrides: Partial<ContentInsert>) {
    const [row] = await db
      .insert(content)
      .values({
        title: `UI-32 ${label} ${RUN_ID}`,
        slug: `ui32-${label}-${RUN_ID}`,
        content: `Body of the ${label} item ${RUN_ID}.`,
        excerpt: `Excerpt of the ${label} item ${RUN_ID}.`,
        type: "ANNOUNCEMENT",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        authorId: authors.main.id,
        publishedAt: new Date(Date.now() - DAY),
        tags: [`ui32-${RUN_ID}`],
        ...overrides,
      })
      .returning();
    contentIds.push(row.id);
    rows[label] = row;
    return row;
  }

  async function cleanup() {
    // FK order: content before users. The slug sweep catches anything an
    // assertion-aborted test left behind.
    if (contentIds.length > 0) {
      await db.delete(content).where(inArray(content.id, contentIds));
    }
    await db.delete(content).where(like(content.slug, `%${RUN_ID}%`));
    if (userIds.length > 0) {
      // Deleting the viewer user cascades their subscription row.
      await db.delete(user).where(inArray(user.id, userIds));
    }
    if (tierIds.length > 0) {
      await db.delete(membershipTier).where(inArray(membershipTier.id, tierIds));
    }
  }

  return {
    RUN_ID,
    authors,
    rows,
    seedAuthor,
    seedContent,
    cleanup,
    seedMemberViewer,
    getMemberViewerId,
  };

  /** Seeds the entitled viewer: user + tier + ACTIVE subscription. */
  async function seedMemberViewer(): Promise<string> {
    const name = `UI-32 Member Viewer ${RUN_ID}`;
    const [viewer] = await db
      .insert(user)
      .values({
        username: `ui32-viewer-${RUN_ID}`,
        email: `ui32-viewer-${RUN_ID}@example.test`,
        name,
        role: "member",
      })
      .returning();
    userIds.push(viewer.id);

    const [tier] = await db
      .insert(membershipTier)
      .values({
        name: `ui32-tier-${RUN_ID}`,
        displayName: `UI-32 Tier ${RUN_ID}`,
        description: "Viewer tier for the issue #23 gate test",
        price: "10.00",
        billingCycle: "monthly",
        features: {},
        benefits: {},
        permissions: {},
      })
      .returning();
    tierIds.push(tier.id);

    await db.insert(membershipSubscription).values({
      userId: viewer.id,
      tierId: tier.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(Date.now() - DAY),
      currentPeriodEnd: new Date(Date.now() + 30 * DAY),
    });
    memberViewerId = viewer.id;
    return viewer.id;
  }

  function getMemberViewerId(): string | null {
    return memberViewerId;
  }
}

const fixtures = createFixtures();

/** Every id this suite expects in the member inbox. */
let inboxVisibleIds: string[] = [];
/** Every id this suite expects the member inbox to hide. */
let inboxHiddenIds: string[] = [];

beforeAll(async () => {
  EVENT_A = `ui32-event-a-${fixtures.RUN_ID}`;
  EVENT_B = `ui32-event-b-${fixtures.RUN_ID}`;

  await fixtures.seedAuthor("main");
  await fixtures.seedAuthor("secondary");
  // Issue #23: MEMBERS_ONLY rows now require an entitled viewer, so every
  // read path in this suite passes the ACTIVE-subscription member viewer.
  await fixtures.seedMemberViewer();

  // ── Inbox-visible: PUBLISHED + (PUBLIC | MEMBERS_ONLY) + publishedAt past ──
  await fixtures.seedContent("inbox-public", {
    publishedAt: new Date(Date.now() - 3 * DAY),
  });
  await fixtures.seedContent("inbox-members-only", {
    visibility: "MEMBERS_ONLY",
    publishedAt: new Date(Date.now() - 2 * DAY),
  });
  await fixtures.seedContent("inbox-older", {
    authorId: fixtures.authors.secondary.id,
    publishedAt: new Date(Date.now() - 5 * DAY),
  });
  await fixtures.seedContent("inbox-newest", {
    publishedAt: new Date(Date.now() - 4 * HOUR),
  });

  // Banner fixtures that are themselves inbox-visible (audience-ready
  // announcements that additionally carry targeting metadata).
  await fixtures.seedContent("banner-targeted-public", {
    metadata: { ui: { targetEventId: EVENT_A } },
    publishedAt: new Date(Date.now() - 6 * HOUR),
  });
  await fixtures.seedContent("banner-targeted-members", {
    visibility: "MEMBERS_ONLY",
    metadata: { ui: { targetEventId: EVENT_A } },
    publishedAt: new Date(Date.now() - 7 * HOUR),
  });
  await fixtures.seedContent("banner-future-expiry", {
    metadata: {
      ui: { targetEventId: EVENT_A, expiresAt: new Date(Date.now() + 2 * DAY).toISOString() },
    },
    publishedAt: new Date(Date.now() - 8 * HOUR),
  });

  inboxVisibleIds = Object.keys(fixtures.rows).map((label) => fixtures.rows[label].id);

  // ── Inbox-hidden: every lifecycle/visibility/date/type state excluded ──
  await fixtures.seedContent("draft-announcement", { status: "DRAFT", publishedAt: null });
  await fixtures.seedContent("archived-announcement", {
    status: "ARCHIVED",
    publishedAt: new Date(Date.now() - 10 * DAY),
  });
  await fixtures.seedContent("deleted-announcement", {
    status: "DELETED",
    publishedAt: new Date(Date.now() - 10 * DAY),
  });
  await fixtures.seedContent("scheduled-future-announcement", {
    status: "SCHEDULED",
    publishedAt: new Date(Date.now() + 2 * DAY),
  });
  // PUBLISHED + PUBLIC but with a future publish date: the date gate alone
  // must keep it hidden (independent of the status gate).
  await fixtures.seedContent("future-published-announcement", {
    publishedAt: new Date(Date.now() + 3 * DAY),
  });
  // Narrower-than-MEMBERS_ONLY visibilities never reach the member inbox.
  await fixtures.seedContent("premium-announcement", { visibility: "PREMIUM_MEMBERS" });
  await fixtures.seedContent("specific-roles-announcement", { visibility: "SPECIFIC_ROLES" });
  await fixtures.seedContent("private-announcement", { visibility: "PRIVATE" });
  // Non-announcement content types must not leak into the inbox.
  await fixtures.seedContent("stray-article", { type: "ARTICLE" });

  // ── Banner-hidden: targeting/audience/lifecycle states excluded ──
  await fixtures.seedContent("banner-targeted-other-event", {
    metadata: { ui: { targetEventId: EVENT_B } },
  });
  await fixtures.seedContent("banner-untargeted", {});
  await fixtures.seedContent("banner-expired", {
    metadata: {
      ui: { targetEventId: EVENT_A, expiresAt: new Date(Date.now() - 2 * HOUR).toISOString() },
    },
  });
  await fixtures.seedContent("banner-targeted-draft", {
    status: "DRAFT",
    publishedAt: null,
    metadata: { ui: { targetEventId: EVENT_A } },
  });
  await fixtures.seedContent("banner-targeted-future-publish", {
    publishedAt: new Date(Date.now() + DAY),
    metadata: { ui: { targetEventId: EVENT_A } },
  });

  // Targeting and expiry are banner-only filters: the three untargeted /
  // other-event / expired fixtures above are still audience-ready rows, so
  // the member inbox legitimately shows them. The hidden set is therefore
  // an explicit list of lifecycle/visibility/date/type exclusions only.
  const hiddenLabels = [
    "draft-announcement",
    "archived-announcement",
    "deleted-announcement",
    "scheduled-future-announcement",
    "future-published-announcement",
    "premium-announcement",
    "specific-roles-announcement",
    "private-announcement",
    "stray-article",
    "banner-targeted-draft",
    "banner-targeted-future-publish",
  ];
  inboxHiddenIds = hiddenLabels.map((label) => fixtures.rows[label].id);
});

afterAll(async () => {
  await fixtures.cleanup();
});

describe("issue #23 — MEMBERS_ONLY requires an entitled member, not just a session", () => {
  test("inbox: a signed-in user with no subscription sees only PUBLIC rows", async () => {
    // authors.main is a signed-in-style user with NO subscription — derived
    // status `none`, not entitled. MEMBERS_ONLY rows must be hidden.
    const nonMemberId = fixtures.authors.main.id;
    const result = await listMemberAnnouncements({
      page: 1,
      limit: 100,
      viewerUserId: nonMemberId,
    });
    const ids = new Set(result.items.map((item) => item.id));

    expect(ids.has(fixtures.rows["inbox-public"].id)).toBe(true);
    expect(ids.has(fixtures.rows["inbox-members-only"].id)).toBe(false);
  });

  test("widget: a non-member only ever gets a PUBLIC latest announcement", async () => {
    // authors.main has no subscription — derived status `none`, not
    // entitled. Rather than asserting a specific fixture id (the widget
    // scans the whole content table), compare against the ground-truth
    // inbox read path for the same viewer: the widget's row must be
    // PUBLIC and must never be any MEMBERS_ONLY fixture row.
    const nonMemberId = fixtures.authors.main.id;
    const latest = await getLatestAnnouncement(nonMemberId);
    expect(latest).not.toBeNull();
    expect(latest!.visibility).toBe("PUBLIC");

    const truth = await listMemberAnnouncements({
      page: 1,
      limit: 1,
      viewerUserId: nonMemberId,
    });
    if (truth.items.length > 0) {
      expect(latest!.id).toBe(truth.items[0].id);
    }
    expect(latest!.id).not.toBe(fixtures.rows["inbox-members-only"].id);
    expect(latest!.id).not.toBe(fixtures.rows["banner-targeted-members"].id);
  });

  test("widget: an entitled member's latest announcement matches the member-visible ground truth", async () => {
    const viewerId = fixtures.getMemberViewerId();
    const latest = await getLatestAnnouncement(viewerId);
    expect(latest).not.toBeNull();

    const truth = await listMemberAnnouncements({
      page: 1,
      limit: 1,
      viewerUserId: viewerId,
    });
    if (truth.items.length > 0) {
      // Issue #23: MEMBERS_ONLY rows are included for entitled viewers, so
      // the widget and the member inbox must agree on the single newest
      // audience-ready row — whatever its visibility.
      expect(latest!.id).toBe(truth.items[0].id);
    }
  });

  test("banner: an authenticated non-member gets only PUBLIC banners", async () => {
    const nonMemberId = fixtures.authors.main.id;
    const items = await listEventAnnouncements(EVENT_A, {
      authenticated: true,
      userId: nonMemberId,
    });
    const ids = items.map((item) => item.id);
    expect(ids).toContain(fixtures.rows["banner-targeted-public"].id);
    // The MEMBERS_ONLY banner is reserved for entitled members. The DTO
    // deliberately omits `visibility` (member-safe allow-list), so the
    // absence assertion above is the gate proof.
    expect(ids).not.toContain(fixtures.rows["banner-targeted-members"].id);
  });
});

// ── Suites ──────────────────────────────────────────────────────────────────

describe("member announcement inbox read path (UI-32)", () => {
  test("returns only PUBLISHED announcements at member visibility with a passed publish date", async () => {
    const first = await listMemberAnnouncements({
      page: 1,
      limit: 100,
      viewerUserId: fixtures.getMemberViewerId(),
    });
    const ids = new Set(first.items.map((item) => item.id));

    for (const id of inboxVisibleIds) expect(ids.has(id)).toBe(true);
    for (const id of inboxHiddenIds) expect(ids.has(id)).toBe(false);
  });

  test("list projection is an exact member-safe allow-list", async () => {
    const first = await listMemberAnnouncements({
      page: 1,
      limit: 100,
      viewerUserId: fixtures.getMemberViewerId(),
    });
    const ours = first.items.filter((item) => inboxVisibleIds.includes(item.id));
    expect(ours.length).toBe(inboxVisibleIds.length);

    for (const item of ours) {
      expect(Object.keys(item).sort()).toEqual([
        "author",
        "content",
        "excerpt",
        "id",
        "publishedAt",
        "slug",
        "title",
      ]);
      if (item.author) {
        expect(Object.keys(item.author).sort()).toEqual(["id", "image", "name"]);
      }
    }

    const withMainAuthor = ours.find(
      (item) => item.id === fixtures.rows["inbox-public"].id,
    ) as MemberAnnouncement;
    expect(withMainAuthor.author).toEqual({
      id: fixtures.authors.main.id,
      image: null,
      name: fixtures.authors.main.name,
    });

    // Never-public fields must be absent — by name and by value.
    for (const item of ours) {
      for (const forbidden of NEVER_PUBLIC_FIELDS) {
        expect(item).not.toHaveProperty(forbidden);
      }
      expect(JSON.stringify(item)).not.toContain(fixtures.authors.main.email);
      expect(JSON.stringify(item)).not.toContain(fixtures.authors.secondary.email);
    }
  });

  test("items are ordered newest first", async () => {
    const first = await listMemberAnnouncements({
      page: 1,
      limit: 100,
      viewerUserId: fixtures.getMemberViewerId(),
    });
    const ours = first.items.filter((item) => inboxVisibleIds.includes(item.id));
    for (let i = 1; i < ours.length; i += 1) {
      expect(ours[i - 1].publishedAt.getTime()).toBeGreaterThanOrEqual(
        ours[i].publishedAt.getTime(),
      );
    }
    expect(ours[0].id).toBe(fixtures.rows["inbox-newest"].id);
  });

  test("pagination: page/limit/total envelope, disjoint coverage, clamped inputs", async () => {
    const limit = 3;
    const first = await listMemberAnnouncements({
      page: 1,
      limit,
      viewerUserId: fixtures.getMemberViewerId(),
    });

    expect(first.page).toBe(1);
    expect(first.limit).toBe(limit);
    expect(first.total).toBeGreaterThanOrEqual(inboxVisibleIds.length);
    expect(first.totalPages).toBe(Math.max(1, Math.ceil(first.total / limit)));
    expect(first.items.length).toBe(Math.min(limit, first.total));

    // Walk every page: ids are disjoint and coverage matches the total.
    const seen: string[] = [];
    for (let page = 1; page <= first.totalPages; page += 1) {
      const result = await listMemberAnnouncements({
        page,
        limit,
        viewerUserId: fixtures.getMemberViewerId(),
      });
      expect(result.page).toBe(page);
      seen.push(...result.items.map((item) => item.id));
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBe(first.total);
    for (const id of inboxVisibleIds) {
      expect(seen).toContain(id);
    }

    // Inputs are clamped, never trusted raw.
    const clamped = await listMemberAnnouncements({
      page: 0,
      limit: 500,
      viewerUserId: fixtures.getMemberViewerId(),
    });
    expect(clamped.page).toBe(1);
    expect(clamped.limit).toBeLessThanOrEqual(100);
  });
});

describe("event announcement banner read path (UI-32)", () => {
  test("member viewer: targeted, audience-ready, unexpired announcements for the event", async () => {
    const items = await listEventAnnouncements(EVENT_A, {
      authenticated: true,
      userId: fixtures.getMemberViewerId(),
    });
    const ids = items.map((item) => item.id);

    expect(ids).toContain(fixtures.rows["banner-targeted-public"].id);
    expect(ids).toContain(fixtures.rows["banner-targeted-members"].id);
    expect(ids).toContain(fixtures.rows["banner-future-expiry"].id);

    // Targeting is per-event, never feed-wide.
    expect(ids).not.toContain(fixtures.rows["banner-targeted-other-event"].id);
    expect(ids).not.toContain(fixtures.rows["banner-untargeted"].id);
    // Expiry retires a banner even while the row stays published.
    expect(ids).not.toContain(fixtures.rows["banner-expired"].id);
    // Lifecycle and date gates still apply on top of targeting.
    expect(ids).not.toContain(fixtures.rows["banner-targeted-draft"].id);
    expect(ids).not.toContain(fixtures.rows["banner-targeted-future-publish"].id);
  });

  test("anonymous viewer: only PUBLIC announcements reach the banner", async () => {
    const items = await listEventAnnouncements(EVENT_A, { authenticated: false });
    const ids = items.map((item) => item.id);

    expect(ids).toContain(fixtures.rows["banner-targeted-public"].id);
    expect(ids).toContain(fixtures.rows["banner-future-expiry"].id);
    expect(ids).not.toContain(fixtures.rows["banner-targeted-members"].id);
  });

  test("an event nothing targets gets no banners", async () => {
    const items = await listEventAnnouncements(`ui32-no-such-event-${fixtures.RUN_ID}`, {
      authenticated: true,
    });
    expect(items).toEqual([]);
  });

  test("banner projection is an exact member-safe allow-list, ordered newest first", async () => {
    const items = await listEventAnnouncements(EVENT_A, {
      authenticated: true,
      userId: fixtures.getMemberViewerId(),
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(["excerpt", "id", "publishedAt", "title"]);
      for (const forbidden of NEVER_PUBLIC_FIELDS) {
        expect(item).not.toHaveProperty(forbidden);
      }
      expect(JSON.stringify(item)).not.toContain(fixtures.authors.main.email);
    }
    const ours = items.filter((item) =>
      [
        fixtures.rows["banner-targeted-public"].id,
        fixtures.rows["banner-targeted-members"].id,
        fixtures.rows["banner-future-expiry"].id,
      ].includes(item.id),
    );
    expect(ours.length).toBe(3);
    for (let i = 1; i < ours.length; i += 1) {
      expect(ours[i - 1].publishedAt.getTime()).toBeGreaterThanOrEqual(
        ours[i].publishedAt.getTime(),
      );
    }
  });
});
