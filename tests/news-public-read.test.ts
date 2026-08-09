/**
 * UI-26 — Public /news reading surface: ring-0 read path.
 *
 * Exercises src/lib/services/content/public-news.ts against the shared test
 * database (DATABASE_URL from .env). The public news feed is the security
 * boundary for anonymous visitors (no permission gate in front of it), so
 * this suite pins down the entire exposure contract from the planning doc's
 * per-module matrix row for Content:
 *
 *   - only status PUBLISHED + visibility PUBLIC + publishedAt <= now surface;
 *   - DRAFT / ARCHIVED / DELETED / SCHEDULED-future / MEMBERS_ONLY never do;
 *   - the feed is restricted to the three managed content types
 *     (ARTICLE, ANNOUNCEMENT, PUBLICATION — decision D9: one /news feed);
 *   - the projection is an exact public-safe allow-list (no email, no
 *     internal status/visibility, no metadata blob);
 *   - pagination (page/limit/total) and the type filter behave.
 *
 * Fixtures follow the tests/workspaces-api/fixtures.ts pattern: a RUN_ID
 * name-isolates every row this file creates and cleanup() removes them in
 * FK order (content before users), so the file is self-cleaning against the
 * shared database. Rows are seeded through drizzle directly (no session is
 * needed for a read-path test).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";
import { db } from "@/db/client";
import { content, user } from "@/db/schema";
import {
  getPublicNewsItem,
  listPublicNews,
  NEWS_TYPES,
  type PublicNewsItem,
  type PublicNewsSummary,
} from "@/lib/services/content/public-news";

// ── Fixtures ────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const HOUR = 3_600_000;

type ContentInsert = typeof content.$inferInsert;

/** Fields that must never appear in a ring-0 projection, by name. */
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

function createFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const userIds: string[] = [];
  const contentIds: string[] = [];
  const authors: Record<string, { id: string; name: string; email: string }> = {};
  const rows: Record<string, typeof content.$inferSelect> = {};

  async function seedAuthor(label: string) {
    const name = `UI-26 Author ${label} ${RUN_ID}`;
    const email = `ui26-${label}-${RUN_ID}@example.test`;
    const [row] = await db
      .insert(user)
      .values({
        username: `ui26-${label}-${RUN_ID}`,
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
        title: `UI-26 ${label} ${RUN_ID}`,
        slug: `ui26-${label}-${RUN_ID}`,
        content: `Body of the ${label} item ${RUN_ID}.`,
        excerpt: `Excerpt of the ${label} item ${RUN_ID}.`,
        type: "ARTICLE",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        authorId: authors.main.id,
        publishedAt: new Date(Date.now() - DAY),
        tags: [`ui26-${RUN_ID}`],
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
      await db.delete(user).where(inArray(user.id, userIds));
    }
  }

  return { RUN_ID, authors, rows, seedAuthor, seedContent, cleanup };
}

const fixtures = createFixtures();

/** Every id this suite expects to be visible on the public feed. */
let visibleIds: string[] = [];
/** Every id this suite expects the public feed to hide. */
let hiddenIds: string[] = [];

beforeAll(async () => {
  await fixtures.seedAuthor("main");
  await fixtures.seedAuthor("secondary");

  // Visible: one per managed content type, staggered publish dates.
  await fixtures.seedContent("visible-article", {
    type: "ARTICLE",
    publishedAt: new Date(Date.now() - 3 * DAY),
  });
  await fixtures.seedContent("visible-announcement", {
    type: "ANNOUNCEMENT",
    publishedAt: new Date(Date.now() - 2 * DAY),
  });
  await fixtures.seedContent("visible-publication", {
    type: "PUBLICATION",
    authorId: fixtures.authors.secondary.id,
    publishedAt: new Date(Date.now() - 1 * DAY),
  });
  // Extra visible articles so pagination has more than one page at limit 2.
  await fixtures.seedContent("visible-article-newer", {
    type: "ARTICLE",
    publishedAt: new Date(Date.now() - 4 * HOUR),
  });
  await fixtures.seedContent("visible-article-newest", {
    type: "ARTICLE",
    publishedAt: new Date(Date.now() - 5 * HOUR),
  });

  visibleIds = Object.entries(fixtures.rows)
    .filter(([label]) => label.startsWith("visible-"))
    .map(([, row]) => row.id);

  // Hidden: every lifecycle/visibility/date state the matrix excludes.
  await fixtures.seedContent("draft-article", { status: "DRAFT", publishedAt: null });
  await fixtures.seedContent("archived-article", {
    status: "ARCHIVED",
    publishedAt: new Date(Date.now() - 10 * DAY),
  });
  await fixtures.seedContent("deleted-article", {
    status: "DELETED",
    publishedAt: new Date(Date.now() - 10 * DAY),
  });
  await fixtures.seedContent("scheduled-future-article", {
    status: "SCHEDULED",
    publishedAt: new Date(Date.now() + 2 * DAY),
  });
  await fixtures.seedContent("members-only-article", {
    status: "PUBLISHED",
    visibility: "MEMBERS_ONLY",
    publishedAt: new Date(Date.now() - DAY),
  });
  // PUBLISHED + PUBLIC but with a future publish date: the date gate alone
  // must keep it hidden (independent of the status gate).
  await fixtures.seedContent("future-published-article", {
    status: "PUBLISHED",
    visibility: "PUBLIC",
    publishedAt: new Date(Date.now() + 3 * DAY),
  });
  // A published-public row of a type outside the three managed collections
  // must not leak into /news either (the enum has nine content types).
  await fixtures.seedContent("stray-page", {
    type: "PAGE",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    publishedAt: new Date(Date.now() - DAY),
  });

  hiddenIds = Object.entries(fixtures.rows)
    .filter(([label]) => !label.startsWith("visible-"))
    .map(([, row]) => row.id);
});

afterAll(async () => {
  await fixtures.cleanup();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Walk every page of a list query and return all items in order. */
async function collectAll(
  filters: Parameters<typeof listPublicNews>[0] = {},
): Promise<{ items: PublicNewsSummary[]; total: number }> {
  const first = await listPublicNews({ ...filters, page: 1, limit: 100 });
  return { items: first.items, total: first.total };
}

// ── Suite ───────────────────────────────────────────────────────────────────

describe("public news read path (UI-26)", () => {
  test("D9: the feed covers exactly the three managed content types", () => {
    expect([...NEWS_TYPES].sort()).toEqual(["ANNOUNCEMENT", "ARTICLE", "PUBLICATION"]);
  });

  test("returns only PUBLISHED + PUBLIC rows whose publishedAt has passed", async () => {
    const { items } = await collectAll();
    const ids = new Set(items.map((item) => item.id));

    for (const id of visibleIds) {
      expect(ids.has(id)).toBe(true);
    }
    for (const id of hiddenIds) {
      expect(ids.has(id)).toBe(false);
    }

    // Every returned row carries the audience-ready shape.
    for (const item of items) {
      expect(item.publishedAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(NEWS_TYPES).toContain(item.type);
    }
  });

  test("list projection is an exact public-safe allow-list", async () => {
    const { items } = await collectAll();
    const ours = items.filter((item) => visibleIds.includes(item.id));
    expect(ours.length).toBe(visibleIds.length);

    for (const item of ours) {
      expect(Object.keys(item).sort()).toEqual([
        "author",
        "excerpt",
        "id",
        "publishedAt",
        "slug",
        "title",
        "type",
      ]);
      if (item.author) {
        expect(Object.keys(item.author).sort()).toEqual(["id", "image", "name"]);
      }
    }

    const withMainAuthor = ours.find((item) => item.id === fixtures.rows["visible-article"].id);
    expect(withMainAuthor?.author).toEqual({
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

  test("pagination: page/limit/total envelope and full disjoint coverage", async () => {
    const limit = 2;
    const first = await listPublicNews({ type: "ARTICLE", page: 1, limit });

    expect(first.page).toBe(1);
    expect(first.limit).toBe(limit);
    expect(first.total).toBeGreaterThanOrEqual(3);
    expect(first.totalPages).toBe(Math.max(1, Math.ceil(first.total / limit)));
    expect(first.items.length).toBe(Math.min(limit, first.total));

    // Walk every page: ids are disjoint, coverage is complete, and the last
    // page carries exactly the remainder.
    const seen: string[] = [];
    for (let page = 1; page <= first.totalPages; page += 1) {
      const result = await listPublicNews({ type: "ARTICLE", page, limit });
      expect(result.page).toBe(page);
      const expectedLength =
        page === first.totalPages ? first.total - (first.totalPages - 1) * limit : limit;
      expect(result.items.length).toBe(expectedLength);
      seen.push(...result.items.map((item) => item.id));
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBe(first.total);
    for (const label of ["visible-article", "visible-article-newer", "visible-article-newest"]) {
      expect(seen).toContain(fixtures.rows[label].id);
    }

    // Inputs are clamped, never trusted raw.
    const clamped = await listPublicNews({ page: 0, limit: 500 });
    expect(clamped.page).toBe(1);
    expect(clamped.limit).toBeLessThanOrEqual(100);
  });

  test("type filter narrows the feed to one content type", async () => {
    for (const type of NEWS_TYPES) {
      const { items } = await collectAll({ type });
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.type).toBe(type);
      }
    }

    const announcements = await collectAll({ type: "ANNOUNCEMENT" });
    const announcementIds = announcements.items.map((item) => item.id);
    expect(announcementIds).toContain(fixtures.rows["visible-announcement"].id);
    expect(announcementIds).not.toContain(fixtures.rows["visible-article"].id);
    expect(announcementIds).not.toContain(fixtures.rows["visible-publication"].id);
  });

  test("items are ordered newest first", async () => {
    const { items } = await collectAll({ type: "ARTICLE" });
    const ours = items.filter((item) => visibleIds.includes(item.id));
    expect(ours.length).toBe(3);
    for (let i = 1; i < ours.length; i += 1) {
      expect(ours[i - 1].publishedAt.getTime()).toBeGreaterThanOrEqual(
        ours[i].publishedAt.getTime(),
      );
    }
    expect(ours[0].id).toBe(fixtures.rows["visible-article-newer"].id);
  });

  test("detail: returns the reading view by id and by slug", async () => {
    const seeded = fixtures.rows["visible-article"];
    for (const lookup of [seeded.id, seeded.slug]) {
      const item = await getPublicNewsItem(lookup);
      expect(item).not.toBeNull();
      expect(item?.id).toBe(seeded.id);
      expect(item?.title).toBe(seeded.title);
      expect(item?.slug).toBe(seeded.slug);
      expect(item?.content).toBe(seeded.content);
      expect(item?.author?.id).toBe(fixtures.authors.main.id);
      expect(item?.author?.name).toBe(fixtures.authors.main.name);
    }
  });

  test("detail projection is an exact public-safe allow-list", async () => {
    const item = (await getPublicNewsItem(fixtures.rows["visible-article"].id)) as PublicNewsItem;
    expect(Object.keys(item).sort()).toEqual([
      "author",
      "content",
      "excerpt",
      "featuredImage",
      "id",
      "publishedAt",
      "slug",
      "tags",
      "title",
      "type",
    ]);
    if (item.author) {
      expect(Object.keys(item.author).sort()).toEqual(["id", "image", "name"]);
    }
    for (const forbidden of NEVER_PUBLIC_FIELDS) {
      expect(item).not.toHaveProperty(forbidden);
    }
    expect(JSON.stringify(item)).not.toContain(fixtures.authors.main.email);
  });

  test("detail: hidden and unknown items resolve to null", async () => {
    for (const id of hiddenIds) {
      expect(await getPublicNewsItem(id)).toBeNull();
    }
    expect(await getPublicNewsItem(fixtures.rows["visible-article"].slug.toUpperCase())).toBeNull();
    expect(await getPublicNewsItem("00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getPublicNewsItem(`ui26-no-such-slug-${fixtures.RUN_ID}`)).toBeNull();
  });
});
