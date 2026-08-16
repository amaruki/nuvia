/**
 * UI-27 — Public forum reading surface: ring-0/ring-1 read path.
 *
 * Exercises src/lib/services/forum/public-reads.ts against the shared test
 * database (DATABASE_URL from .env). The (public)/forums pages call these
 * service functions from server components with NO permission gate in front
 * of them, so the service is the security boundary. This suite pins the
 * entire exposure contract from the planning doc's per-module matrix row for
 * Forums and decision D8 ("hybrid per category: members-only reading by
 * default; admins open categories to anonymous readers through
 * isPrivate/requiredRole"):
 *
 *   - category audience gate: anonymous readers see only categories that are
 *     active, NOT isPrivate, and carry NO requiredRole; signed-in readers
 *     additionally see isPrivate categories and any category whose
 *     requiredRole their role level satisfies (same ROLE_HIERARCHY comparison
 *     as the write gate in src/lib/services/forum/actor.ts); unknown stored
 *     role names fail closed; inactive categories are visible to nobody;
 *   - only PUBLISHED posts surface — PENDING_REVIEW, HIDDEN, DELETED, DRAFT
 *     and ARCHIVED never leave the moderation side, for any reader;
 *   - thread detail carries PUBLISHED comments only (PENDING, HIDDEN and
 *     DELETED comments never surface);
 *   - the projection is an exact public-safe allow-list: no emails, no
 *     author role, no category gating columns (isPrivate/requiredRole/
 *     metadata), no moderation status vocabulary;
 *   - category card stats (postCount/lastPostAt) count PUBLISHED posts only;
 *   - pagination clamps and covers disjointly; sticky threads sort first.
 *
 * Fixtures follow the tests/news-public-read.test.ts pattern: a RUN_ID
 * name-isolates every row this file creates and cleanup() removes them in FK
 * order, so the file is self-cleaning against the shared database. Rows are
 * seeded through drizzle directly (no session is needed for a read-path
 * test).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "@/db/client";
import { forumCategory, forumComment, forumPost, user } from "@/db/schema";
import {
  getPublicForumCategory,
  getPublicForumThread,
  listPublicForumCategories,
  listPublicForumThreads,
  type ForumReader,
} from "@/lib/services/forum/public-reads";

// ── Fixtures ────────────────────────────────────────────────────────────────

const HOUR = 3_600_000;

/** Whole-second timestamps so Postgres round-trips compare exactly. */
function ago(ms: number): Date {
  return new Date(Math.floor((Date.now() - ms) / 1000) * 1000);
}

type CategoryInsert = typeof forumCategory.$inferInsert;
type PostInsert = typeof forumPost.$inferInsert;
type CommentInsert = typeof forumComment.$inferInsert;

/** Fields that must never appear in a ring-0/ring-1 forum projection. */
const NEVER_PUBLIC_FIELDS = [
  "email",
  "authorEmail",
  "author_email",
  "role",
  "authorRole",
  "status",
  "isPrivate",
  "is_private",
  "requiredRole",
  "required_role",
  "isActive",
  "metadata",
  "parentId", // category parent, not comment parent
  "sortOrder",
  "moderationReason",
  "reportReason",
];

function createFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const userIds: string[] = [];
  const categoryIds: string[] = [];
  const postIds: string[] = [];
  const commentIds: string[] = [];
  const authors: Record<string, { id: string; name: string; email: string }> = {};
  const categories: Record<string, typeof forumCategory.$inferSelect> = {};
  const posts: Record<string, typeof forumPost.$inferSelect> = {};
  const comments: Record<string, typeof forumComment.$inferSelect> = {};

  async function seedAuthor(label: string, role: string) {
    const name = `UI-27 Author ${label} ${RUN_ID}`;
    const email = `ui27-${label}-${RUN_ID}@example.test`;
    const [row] = await db
      .insert(user)
      .values({
        username: `ui27-${label}-${RUN_ID}`,
        email,
        name,
        role,
      })
      .returning();
    userIds.push(row.id);
    authors[label] = { id: row.id, name, email };
    return row;
  }

  async function seedCategory(label: string, overrides: Partial<CategoryInsert>) {
    const [row] = await db
      .insert(forumCategory)
      .values({
        name: `ui27-${label}-${RUN_ID}`,
        displayName: `UI-27 ${label} ${RUN_ID}`,
        description: `Fixture category ${label} for the UI-27 read-path suite.`,
        icon: "💬",
        color: "#6366f1",
        sortOrder: 0,
        isActive: true,
        isPrivate: false,
        requiredRole: null,
        ...overrides,
      })
      .returning();
    categoryIds.push(row.id);
    categories[label] = row;
    return row;
  }

  async function seedPost(label: string, categoryLabel: string, overrides: Partial<PostInsert>) {
    const [row] = await db
      .insert(forumPost)
      .values({
        categoryId: categories[categoryLabel].id,
        userId: authors.member.id,
        title: `UI-27 ${label} ${RUN_ID}`,
        content: `Body of the ${label} thread ${RUN_ID}.`,
        type: "DISCUSSION",
        status: "PUBLISHED",
        ...overrides,
      })
      .returning();
    postIds.push(row.id);
    posts[label] = row;
    return row;
  }

  async function seedComment(label: string, postLabel: string, overrides: Partial<CommentInsert>) {
    const [row] = await db
      .insert(forumComment)
      .values({
        postId: posts[postLabel].id,
        userId: authors.member.id,
        content: `Comment ${label} on ${postLabel} ${RUN_ID}.`,
        status: "PUBLISHED",
        ...overrides,
      })
      .returning();
    commentIds.push(row.id);
    comments[label] = row;
    return row;
  }

  async function cleanup() {
    // FK order: comments → posts → categories → users. The RUN_ID sweeps
    // catch anything an assertion-aborted test left behind.
    if (commentIds.length > 0) {
      await db.delete(forumComment).where(inArray(forumComment.id, commentIds));
    }
    await db.delete(forumComment).where(like(forumComment.content, `%${RUN_ID}%`));
    if (postIds.length > 0) {
      await db.delete(forumPost).where(inArray(forumPost.id, postIds));
    }
    await db.delete(forumPost).where(like(forumPost.title, `%${RUN_ID}%`));
    if (categoryIds.length > 0) {
      await db.delete(forumCategory).where(inArray(forumCategory.id, categoryIds));
    }
    await db.delete(forumCategory).where(like(forumCategory.name, `%${RUN_ID}%`));
    if (userIds.length > 0) {
      await db.delete(user).where(inArray(user.id, userIds));
    }
  }

  return {
    RUN_ID,
    authors,
    categories,
    posts,
    comments,
    seedAuthor,
    seedCategory,
    seedPost,
    seedComment,
    cleanup,
  };
}

const fixtures = createFixtures();

// Readers for the audience gate.
const ANONYMOUS: ForumReader | null = null;
const MEMBER: ForumReader = { role: "member" };
const BASIC_USER: ForumReader = { role: "user" };
const PROFESSIONAL: ForumReader = { role: "member_professional" };
const SUPERADMIN: ForumReader = { role: "superadmin" };

beforeAll(async () => {
  await fixtures.seedAuthor("member", "member");
  await fixtures.seedAuthor("professional", "member_professional");

  // ── Categories covering every audience-gate combination ─────────────────
  // Opened to anonymous readers: active, not private, no role gate.
  await fixtures.seedCategory("open", {});
  // Members-only: signed-in readers only (isPrivate = true).
  await fixtures.seedCategory("members", { isPrivate: true });
  // Role-gated: member_professional or higher.
  await fixtures.seedCategory("pro", { requiredRole: "member_professional" });
  // Inactive: visible to nobody on the read path.
  await fixtures.seedCategory("inactive", { isActive: false });
  // Unknown stored role name: must fail closed (mirrors the write gate).
  await fixtures.seedCategory("bogus-role", { requiredRole: "nonexistent_role" });

  // ── Threads in the open category: one per post lifecycle state ──────────
  await fixtures.seedPost("sticky", "open", {
    status: "PUBLISHED",
    isSticky: true,
    createdAt: ago(5 * HOUR),
  });
  await fixtures.seedPost("published", "open", {
    status: "PUBLISHED",
    createdAt: ago(3 * HOUR),
  });
  await fixtures.seedPost("pending", "open", {
    status: "PENDING_REVIEW",
    createdAt: ago(2 * HOUR),
  });
  await fixtures.seedPost("hidden", "open", {
    status: "HIDDEN",
    createdAt: ago(90 * 60_000),
  });
  await fixtures.seedPost("draft", "open", {
    status: "DRAFT",
    createdAt: ago(80 * 60_000),
  });
  await fixtures.seedPost("archived", "open", {
    status: "ARCHIVED",
    createdAt: ago(70 * 60_000),
  });
  await fixtures.seedPost("deleted", "open", {
    status: "DELETED",
    createdAt: ago(60 * 60_000),
  });

  // Threads in the gated categories (all PUBLISHED).
  await fixtures.seedPost("members-thread", "members", {
    userId: fixtures.authors.professional.id,
    createdAt: ago(4 * HOUR),
  });
  await fixtures.seedPost("pro-thread", "pro", {
    userId: fixtures.authors.professional.id,
    createdAt: ago(4 * HOUR),
  });
  // An unpublished thread in the members-only category: the category gate
  // and the status gate must both hold at once.
  await fixtures.seedPost("members-pending", "members", {
    status: "PENDING_REVIEW",
    createdAt: ago(1 * HOUR),
  });

  // ── Comments on the open published thread: one per comment status ───────
  await fixtures.seedComment("published", "published", {
    userId: fixtures.authors.professional.id,
  });
  await fixtures.seedComment("pending", "published", { status: "PENDING" });
  await fixtures.seedComment("hidden", "published", { status: "HIDDEN" });
  await fixtures.seedComment("deleted", "published", { status: "DELETED" });
});

afterAll(async () => {
  await fixtures.cleanup();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function slug(label: string): string {
  return fixtures.categories[label].name;
}

// ── Suite ───────────────────────────────────────────────────────────────────

describe("forum category audience gate (UI-27, D8)", () => {
  test("anonymous readers see only active, non-private categories without a role gate", async () => {
    const categories = await listPublicForumCategories(ANONYMOUS);
    const slugs = categories.map((c) => c.name);

    expect(slugs).toContain(slug("open"));
    expect(slugs).not.toContain(slug("members"));
    expect(slugs).not.toContain(slug("pro"));
    expect(slugs).not.toContain(slug("inactive"));
    expect(slugs).not.toContain(slug("bogus-role"));
  });

  test("any signed-in reader sees isPrivate (members-only) categories", async () => {
    for (const reader of [BASIC_USER, MEMBER, PROFESSIONAL, SUPERADMIN]) {
      const slugs = (await listPublicForumCategories(reader)).map((c) => c.name);
      expect(slugs).toContain(slug("open"));
      expect(slugs).toContain(slug("members"));
      expect(slugs).not.toContain(slug("inactive"));
      expect(slugs).not.toContain(slug("bogus-role"));
    }
  });

  test("requiredRole gates reading by the same ROLE_HIERARCHY as the write gate", async () => {
    // member (level 25) and user (level 10) sit below member_professional (35).
    for (const reader of [BASIC_USER, MEMBER]) {
      const slugs = (await listPublicForumCategories(reader)).map((c) => c.name);
      expect(slugs).not.toContain(slug("pro"));
    }
    // member_professional (35) and superadmin (100) pass the gate.
    for (const reader of [PROFESSIONAL, SUPERADMIN]) {
      const slugs = (await listPublicForumCategories(reader)).map((c) => c.name);
      expect(slugs).toContain(slug("pro"));
    }
  });

  test("unknown stored requiredRole names fail closed for every reader", async () => {
    for (const reader of [ANONYMOUS, MEMBER, PROFESSIONAL, SUPERADMIN]) {
      const slugs = (await listPublicForumCategories(reader)).map((c) => c.name);
      expect(slugs).not.toContain(slug("bogus-role"));
    }
  });

  test("inactive categories are invisible even to superadmin", async () => {
    const slugs = (await listPublicForumCategories(SUPERADMIN)).map((c) => c.name);
    expect(slugs).not.toContain(slug("inactive"));
  });

  test("category projection is an exact public-safe allow-list", async () => {
    const categories = await listPublicForumCategories(ANONYMOUS);
    const open = categories.find((c) => c.name === slug("open"));
    expect(open).toBeDefined();
    for (const category of categories) {
      expect(Object.keys(category).sort()).toEqual([
        "color",
        "description",
        "displayName",
        "icon",
        "id",
        "lastPostAt",
        "name",
        "postCount",
      ]);
      for (const forbidden of NEVER_PUBLIC_FIELDS) {
        expect(category).not.toHaveProperty(forbidden);
      }
    }
    expect(open?.displayName).toBe(fixtures.categories.open.displayName);
    expect(open?.description).toBe(fixtures.categories.open.description);
  });

  test("category card stats count PUBLISHED threads only", async () => {
    const categories = await listPublicForumCategories(MEMBER);
    const open = categories.find((c) => c.name === slug("open"));
    // Only "sticky" and "published" are PUBLISHED; the other five lifecycle
    // states must not inflate the count or the last-activity timestamp.
    expect(open?.postCount).toBe(2);
    expect(open?.lastPostAt).toEqual(fixtures.posts.published.createdAt);

    const members = categories.find((c) => c.name === slug("members"));
    expect(members?.postCount).toBe(1);
    expect(members?.lastPostAt).toEqual(fixtures.posts["members-thread"].createdAt);
  });

  test("getPublicForumCategory applies the same gate on the detail lookup", async () => {
    expect(await getPublicForumCategory(slug("members"), ANONYMOUS)).toBeNull();
    expect(await getPublicForumCategory(slug("pro"), MEMBER)).toBeNull();
    expect(await getPublicForumCategory(slug("inactive"), SUPERADMIN)).toBeNull();
    expect(await getPublicForumCategory(slug("open"), ANONYMOUS)).not.toBeNull();
    expect(await getPublicForumCategory(slug("members"), MEMBER)).not.toBeNull();
    expect(await getPublicForumCategory(slug("pro"), PROFESSIONAL)).not.toBeNull();
    expect(await getPublicForumCategory(`ui27-no-such-${fixtures.RUN_ID}`, MEMBER)).toBeNull();
  });
});

describe("public forum thread list (UI-27)", () => {
  test("returns only PUBLISHED threads: PENDING_REVIEW/HIDDEN/DRAFT/ARCHIVED/DELETED never surface", async () => {
    for (const reader of [ANONYMOUS, MEMBER, SUPERADMIN]) {
      const result = await listPublicForumThreads(slug("open"), reader);
      expect(result).not.toBeNull();
      const ids = result!.items.map((t) => t.id);

      expect(ids).toContain(fixtures.posts.sticky.id);
      expect(ids).toContain(fixtures.posts.published.id);
      expect(ids).toHaveLength(2);
      expect(result!.total).toBe(2);

      for (const hidden of ["pending", "hidden", "draft", "archived", "deleted"]) {
        expect(ids).not.toContain(fixtures.posts[hidden].id);
      }
    }
  });

  test("sticky threads sort first, then newest first", async () => {
    const result = await listPublicForumThreads(slug("open"), ANONYMOUS);
    const ids = result!.items.map((t) => t.id);
    // sticky was created BEFORE published but must still lead the list.
    expect(ids).toEqual([fixtures.posts.sticky.id, fixtures.posts.published.id]);
  });

  test("thread list projection is an exact public-safe allow-list", async () => {
    const result = await listPublicForumThreads(slug("open"), MEMBER);
    for (const thread of result!.items) {
      expect(Object.keys(thread).sort()).toEqual([
        "author",
        "createdAt",
        "id",
        "isLocked",
        "isSticky",
        "lastReplyAt",
        "replyCount",
        "title",
        "type",
        "views",
      ]);
      if (thread.author) {
        expect(Object.keys(thread.author).sort()).toEqual(["avatar", "id", "name"]);
        expect(thread.author).not.toHaveProperty("role");
      }
      for (const forbidden of NEVER_PUBLIC_FIELDS) {
        expect(thread).not.toHaveProperty(forbidden);
      }
      expect(JSON.stringify(thread)).not.toContain(fixtures.authors.member.email);
      expect(JSON.stringify(thread)).not.toContain(fixtures.authors.professional.email);
    }
    const sticky = result!.items.find((t) => t.id === fixtures.posts.sticky.id);
    expect(sticky?.isSticky).toBe(true);
    expect(sticky?.author).toEqual({
      id: fixtures.authors.member.id,
      name: fixtures.authors.member.name,
      avatar: null,
    });
  });

  test("invisible categories resolve to null, not an empty list", async () => {
    expect(await listPublicForumThreads(slug("members"), ANONYMOUS)).toBeNull();
    expect(await listPublicForumThreads(slug("pro"), ANONYMOUS)).toBeNull();
    expect(await listPublicForumThreads(slug("pro"), MEMBER)).toBeNull();
    expect(await listPublicForumThreads(slug("inactive"), SUPERADMIN)).toBeNull();
    expect(await listPublicForumThreads(`ui27-no-such-${fixtures.RUN_ID}`, MEMBER)).toBeNull();
  });

  test("role-gated categories expose their threads to authorized readers only", async () => {
    expect(await listPublicForumThreads(slug("pro"), MEMBER)).toBeNull();
    const result = await listPublicForumThreads(slug("pro"), PROFESSIONAL);
    expect(result).not.toBeNull();
    expect(result!.items.map((t) => t.id)).toEqual([fixtures.posts["pro-thread"].id]);
  });

  test("pagination clamps and covers disjointly", async () => {
    const first = await listPublicForumThreads(slug("open"), ANONYMOUS, { page: 1, limit: 1 });
    expect(first!.page).toBe(1);
    expect(first!.limit).toBe(1);
    expect(first!.total).toBe(2);
    expect(first!.totalPages).toBe(2);
    expect(first!.items.map((t) => t.id)).toEqual([fixtures.posts.sticky.id]);

    const second = await listPublicForumThreads(slug("open"), ANONYMOUS, { page: 2, limit: 1 });
    expect(second!.items.map((t) => t.id)).toEqual([fixtures.posts.published.id]);

    const clamped = await listPublicForumThreads(slug("open"), ANONYMOUS, {
      page: 0,
      limit: 500,
    });
    expect(clamped!.page).toBe(1);
    expect(clamped!.limit).toBeLessThanOrEqual(100);
  });
});

describe("public forum thread detail (UI-27)", () => {
  test("returns the thread with PUBLISHED comments only", async () => {
    const detail = await getPublicForumThread(slug("open"), fixtures.posts.published.id, ANONYMOUS);
    expect(detail).not.toBeNull();
    expect(detail!.post.id).toBe(fixtures.posts.published.id);
    expect(detail!.post.title).toBe(fixtures.posts.published.title);
    expect(detail!.post.content).toBe(fixtures.posts.published.content);
    expect(detail!.category.id).toBe(fixtures.categories.open.id);

    const commentIds = detail!.comments.map((c) => c.id);
    expect(commentIds).toEqual([fixtures.comments.published.id]);
    for (const hidden of ["pending", "hidden", "deleted"]) {
      expect(commentIds).not.toContain(fixtures.comments[hidden].id);
    }
    expect(detail!.comments[0].content).toBe(fixtures.comments.published.content);
    expect(detail!.comments[0].author).toEqual({
      id: fixtures.authors.professional.id,
      name: fixtures.authors.professional.name,
      avatar: null,
    });
  });

  test("detail projections are exact public-safe allow-lists", async () => {
    const detail = await getPublicForumThread(slug("open"), fixtures.posts.published.id, MEMBER);
    expect(Object.keys(detail!).sort()).toEqual(["category", "comments", "post"]);

    expect(Object.keys(detail!.post).sort()).toEqual([
      "author",
      "content",
      "createdAt",
      "id",
      "isLocked",
      "isSticky",
      "lastReplyAt",
      "replyCount",
      "tags",
      "title",
      "type",
      "views",
    ]);
    for (const comment of detail!.comments) {
      expect(Object.keys(comment).sort()).toEqual([
        "author",
        "content",
        "createdAt",
        "id",
        "parentId",
      ]);
    }
    expect(Object.keys(detail!.category).sort()).toEqual([
      "color",
      "description",
      "displayName",
      "icon",
      "id",
      "lastPostAt",
      "name",
      "postCount",
    ]);

    const serialized = JSON.stringify(detail);
    for (const forbidden of NEVER_PUBLIC_FIELDS) {
      expect(detail!.post).not.toHaveProperty(forbidden);
    }
    expect(serialized).not.toContain(fixtures.authors.member.email);
    expect(serialized).not.toContain(fixtures.authors.professional.email);
    // Moderation vocabulary never leaks into the reading view.
    expect(serialized).not.toContain("PENDING_REVIEW");
    expect(serialized).not.toContain("HIDDEN");
  });

  test("unpublished threads resolve to null for every reader", async () => {
    for (const label of ["pending", "hidden", "draft", "archived", "deleted"]) {
      for (const reader of [ANONYMOUS, MEMBER, SUPERADMIN]) {
        expect(
          await getPublicForumThread(slug("open"), fixtures.posts[label].id, reader),
        ).toBeNull();
      }
    }
  });

  test("category gate and status gate hold together", async () => {
    // Published thread in a members-only category: hidden from anonymous.
    expect(
      await getPublicForumThread(slug("members"), fixtures.posts["members-thread"].id, ANONYMOUS),
    ).toBeNull();
    expect(
      await getPublicForumThread(slug("members"), fixtures.posts["members-thread"].id, MEMBER),
    ).not.toBeNull();
    // Pending thread in a members-only category: hidden even from members.
    expect(
      await getPublicForumThread(slug("members"), fixtures.posts["members-pending"].id, MEMBER),
    ).toBeNull();
    // Role-gated thread: member below the gate gets null.
    expect(
      await getPublicForumThread(slug("pro"), fixtures.posts["pro-thread"].id, MEMBER),
    ).toBeNull();
  });

  test("mismatched category slug and unknown ids resolve to null", async () => {
    // Valid post, wrong category slug.
    expect(
      await getPublicForumThread(slug("members"), fixtures.posts.published.id, MEMBER),
    ).toBeNull();
    expect(
      await getPublicForumThread(slug("open"), "00000000-0000-4000-8000-000000000000", MEMBER),
    ).toBeNull();
  });

  test("reading a thread increments its view counter best-effort", async () => {
    const before = await db
      .select({ views: forumPost.views })
      .from(forumPost)
      .where(eq(forumPost.id, fixtures.posts.sticky.id))
      .limit(1);
    await getPublicForumThread(slug("open"), fixtures.posts.sticky.id, ANONYMOUS);
    const after = await db
      .select({ views: forumPost.views })
      .from(forumPost)
      .where(eq(forumPost.id, fixtures.posts.sticky.id))
      .limit(1);
    expect(after[0].views).toBe(before[0].views + 1);
  });
});
