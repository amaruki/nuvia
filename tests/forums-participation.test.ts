/**
 * Public forum participation tests for UI-27 (member forum experience).
 *
 * Pins the write/participation side of the forum against the EXISTING
 * `/api/v1/forums` API: a signed-in member can create a post, comment on a
 * published thread, and file a report; anonymous callers can do none of
 * those; the admin moderation surface stays closed to members.
 *
 * The read side lives in tests/forums-public-read.test.ts (server components
 * call the public read functions directly, mirroring the public-news
 * pattern).
 *
 * Route invocation seam: the forum routes call `requirePermission(perm)`
 * WITHOUT a headers override, so session resolution goes through
 * next/headers's ambient `headers()`. That only works inside a live Next.js
 * request lifecycle, so this suite mocks `next/headers` the same way
 * tests/stripe-webhook-middleware.test.ts mocks its seam (mock.module with
 * the original exports restored in afterAll): the mocked `headers()` returns
 * the headers of the request currently being dispatched (tests run
 * sequentially). This exercises the real routes end-to-end — auth, zod
 * validation, service layer, DB — without touching production code.
 *
 * Integration env: run against a migrated test database + Redis, e.g.
 *   env DATABASE_URL=postgresql://nuvia:nuvia@127.0.0.1:15433/nuvia \
 *       REDIS_URL=redis://127.0.0.1:16380 \
 *       BETTER_AUTH_SECRET=local-test-secret-not-for-production-use-000000 \
 *       bun test tests/forums-participation.test.ts
 */

import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { testIp } from "./helpers";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import * as nextHeadersModule from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { session, account } from "@/db/schema/auth";
import { user } from "@/db/schema/users";
import { forumCategory, forumComment, forumPost, forumReport } from "@/db/schema/forum";
import { roleHasPermission, ROLE_PERMISSIONS } from "@/types/role";
import { POST as createPostRoute, GET as listPostsRoute } from "@/app/api/v1/forums/posts/route";
import { POST as createCommentRoute } from "@/app/api/v1/forums/posts/[id]/comments/route";
import {
  POST as createReportRoute,
  GET as listReportsRoute,
} from "@/app/api/v1/forums/reports/route";
import { POST as moderatePostRoute } from "@/app/api/v1/forums/moderation/posts/[id]/route";
import { POST as createCategoryRoute } from "@/app/api/v1/forums/categories/route";

const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
const API = "http://localhost/api/v1/forums";

// ── Ambient headers seam ────────────────────────────────────────────────────
// The forum routes resolve the session via next/headers's headers(); the mock
// returns the headers of whichever request the suite is currently dispatching.
const originalNextHeaders = { ...nextHeadersModule };
let ambientHeaders: Headers = new Headers();
mock.module("next/headers", () => ({
  ...originalNextHeaders,
  headers: async () => ambientHeaders,
}));

type ForumRoute = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

/** Dispatch a forum route handler with the request's headers made ambient. */
async function callRoute(request: NextRequest, handler: ForumRoute, postId?: string) {
  ambientHeaders = request.headers;
  return handler(request, { params: Promise.resolve({ id: postId ?? "" }) });
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const fixtures = {
  RUN_ID,
  request: (
    url: string,
    opts: {
      method?: string;
      cookie?: string;
      body?: Record<string, unknown>;
    } = {},
  ) =>
    new NextRequest(new URL(url), {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: {
        "x-forwarded-for": testIp(),
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
        ...(opts.body ? { "content-type": "application/json" } : {}),
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    }),

  async signUpWithRole(label: string, role: string) {
    const email = `${label}-${RUN_ID}@example.com`;
    const password = `${label}-${RUN_ID}-password`;
    const name = `UI27 ${label} ${RUN_ID}`;
    const username = `${label.slice(0, 10)}${RUN_ID}`.toLowerCase().replace(/[^a-z0-9]/g, "");

    const signUpRes = await auth.handler(
      new NextRequest(new URL("http://localhost/api/auth/sign-up/email"), {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({ email, password, name, username }),
      }),
    );
    const cookie = signUpRes.headers.get("set-cookie");
    if (!cookie) throw new Error(`sign-up failed for ${label}: ${signUpRes.status}`);

    // Role is set after signup and the user re-signs in so the session
    // payload carries it (sessions cache the user shape at creation).
    await db.update(user).set({ role }).where(eq(user.email, email));

    const signInRes = await auth.handler(
      new NextRequest(new URL("http://localhost/api/auth/sign-in/email"), {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({ email, password }),
      }),
    );
    const sessionCookie = signInRes.headers.get("set-cookie");
    if (!sessionCookie) throw new Error(`sign-in failed for ${label}: ${signInRes.status}`);

    const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    return { userId: rows[0].id, email, cookie: sessionCookie, username, name };
  },

  async seedCategory(label: string, overrides: Partial<typeof forumCategory.$inferInsert> = {}) {
    const [row] = await db
      .insert(forumCategory)
      .values({
        name: `ui27-part-${label}-${RUN_ID}`,
        displayName: `UI-27 Participation ${label} ${RUN_ID}`,
        description: `Fixture category ${label} for the UI-27 participation suite.`,
        sortOrder: 0,
        isActive: true,
        isPrivate: false,
        requiredRole: null,
        ...overrides,
      })
      .returning();
    categoryIds.push(row.id);
    return row;
  },

  async cleanup() {
    const userIds = Object.values(accounts).map((a) => a.userId);
    if (userIds.length > 0) {
      await db.delete(forumReport).where(inArray(forumReport.reportedById, userIds));
      await db.delete(forumComment).where(inArray(forumComment.userId, userIds));
      await db.delete(forumPost).where(inArray(forumPost.userId, userIds));
    }
    await db.delete(forumPost).where(like(forumPost.title, `%${RUN_ID}%`));
    if (categoryIds.length > 0) {
      await db.delete(forumCategory).where(inArray(forumCategory.id, categoryIds));
    }
    if (userIds.length > 0) {
      await db.delete(session).where(inArray(session.userId, userIds));
      await db.delete(account).where(inArray(account.userId, userIds));
      await db.delete(user).where(inArray(user.id, userIds));
    }
  },
};

// ── Shared state ────────────────────────────────────────────────────────────

const accounts: Record<
  string,
  { userId: string; email: string; cookie: string; username: string; name: string }
> = {};
const categoryIds: string[] = [];

let openCategory: typeof forumCategory.$inferSelect;
let proCategory: typeof forumCategory.$inferSelect;

/** Latest forum post by an author (success bodies are {}, so ids come from the db). */
async function latestPostBy(userId: string) {
  const rows = await db
    .select()
    .from(forumPost)
    .where(eq(forumPost.userId, userId))
    .orderBy(desc(forumPost.createdAt))
    .limit(1);
  return rows[0];
}

beforeAll(async () => {
  accounts.moderator = await fixtures.signUpWithRole("moderator", "moderator");
  accounts.member = await fixtures.signUpWithRole("member", "member");
  accounts.professional = await fixtures.signUpWithRole("professional", "member_professional");
  accounts.basic = await fixtures.signUpWithRole("basic", "user");
  accounts.admin = await fixtures.signUpWithRole("admin", "admin");

  openCategory = await fixtures.seedCategory("open");
  proCategory = await fixtures.seedCategory("pro", { requiredRole: "member_professional" });
}, 120_000);

afterAll(async () => {
  // Restore the real next/headers for any later file in the same worker.
  mock.module("next/headers", () => ({ ...originalNextHeaders }));
  await fixtures.cleanup();
}, 30_000);

// ── Suite ───────────────────────────────────────────────────────────────────

describe("forum participation for members (UI-27)", () => {
  test("members hold forum:read and forum:create through the existing permission map", () => {
    for (const role of ["member", "member_student", "member_professional"] as const) {
      expect(roleHasPermission(role, "forum:read")).toBe(true);
      expect(roleHasPermission(role, "forum:create")).toBe(true);
      // Members are not moderators: no moderation capabilities.
      expect(roleHasPermission(role, "forum:moderate")).toBe(false);
    }
  });

  test("member can list posts in an open category through the existing API", async () => {
    const res = await callRoute(
      fixtures.request(`${API}/posts?categoryId=${openCategory.id}`, {
        cookie: accounts.member.cookie,
      }),
      listPostsRoute,
    );
    expect(res.status).toBe(200);
  });

  test("member can create a post through the existing API", async () => {
    const res = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.member.cookie,
        body: {
          categoryId: openCategory.id,
          title: `UI-27P member thread ${RUN_ID}`,
          content: "First post body for the UI-27 participation suite.",
        },
      }),
      createPostRoute,
    );
    expect(res.status).toBe(201);

    const post = await latestPostBy(accounts.member.userId);
    expect(post.title).toBe(`UI-27P member thread ${RUN_ID}`);
    expect(post.categoryId).toBe(openCategory.id);
  });

  test("member-created posts require review: they start PENDING_REVIEW even if PUBLISHED was requested", async () => {
    const res = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.member.cookie,
        body: {
          categoryId: openCategory.id,
          title: `UI-27P member pending thread ${RUN_ID}`,
          content: "This post must not appear publicly until a moderator approves it.",
          status: "PUBLISHED",
        },
      }),
      createPostRoute,
    );
    expect(res.status).toBe(201);

    const post = await latestPostBy(accounts.member.userId);
    expect(post.title).toBe(`UI-27P member pending thread ${RUN_ID}`);
    expect(post.status).toBe("PENDING_REVIEW");
  });

  test("admins publish immediately (control); moderators cannot create posts at all", async () => {
    // FINDING (pinned): the moderator role carries forum:read/update/delete/
    // moderate but NOT forum:create, so moderators manage the queue without
    // posting; admins hold the full forum permission set and publish
    // immediately because createPost() treats forum:moderate as trusted.
    expect(roleHasPermission("moderator", "forum:create")).toBe(false);
    expect(roleHasPermission("admin", "forum:create")).toBe(true);
    expect(roleHasPermission("admin", "forum:moderate")).toBe(true);

    const res = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.admin.cookie,
        body: {
          categoryId: openCategory.id,
          title: `UI-27P admin thread ${RUN_ID}`,
          content: "Admin-created thread used as a comment target.",
        },
      }),
      createPostRoute,
    );
    expect(res.status).toBe(201);

    const post = await latestPostBy(accounts.admin.userId);
    expect(post.status).toBe("PUBLISHED");

    const moderatorAttempt = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.moderator.cookie,
        body: {
          categoryId: openCategory.id,
          title: `UI-27P moderator thread ${RUN_ID}`,
          content: "Moderators lack forum:create.",
        },
      }),
      createPostRoute,
    );
    expect(moderatorAttempt.status).toBe(403);
  });

  test("base user role cannot create posts (forum:create missing)", async () => {
    const res = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.basic.cookie,
        body: {
          categoryId: openCategory.id,
          title: `UI-27P basic-user thread ${RUN_ID}`,
          content: "Should be rejected.",
        },
      }),
      createPostRoute,
    );
    expect(res.status).toBe(403);
  });

  test("anonymous cannot create posts", async () => {
    const res = await callRoute(
      fixtures.request(`${API}/posts`, {
        body: {
          categoryId: openCategory.id,
          title: `UI-27P anonymous thread ${RUN_ID}`,
          content: "Should be rejected.",
        },
      }),
      createPostRoute,
    );
    expect(res.status).toBe(401);
  });

  test("category role gate: member blocked from member_professional category, professional allowed", async () => {
    const denied = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.member.cookie,
        body: {
          categoryId: proCategory.id,
          title: `UI-27P gate denied ${RUN_ID}`,
          content: "Should be rejected by the category role gate.",
        },
      }),
      createPostRoute,
    );
    expect(denied.status).toBe(403);

    const allowed = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.professional.cookie,
        body: {
          categoryId: proCategory.id,
          title: `UI-27P gate allowed ${RUN_ID}`,
          content: "Professional-only category thread.",
        },
      }),
      createPostRoute,
    );
    expect(allowed.status).toBe(201);
  });

  test("member can comment on a PUBLISHED thread; the reply is visible", async () => {
    const thread = await latestPostBy(accounts.admin.userId);
    expect(thread.status).toBe("PUBLISHED");

    const res = await callRoute(
      fixtures.request(`${API}/posts/${thread.id}/comments`, {
        cookie: accounts.member.cookie,
        body: { content: `UI-27P comment body ${RUN_ID}` },
      }),
      createCommentRoute,
      thread.id,
    );
    expect(res.status).toBe(201);

    const comments = await db
      .select()
      .from(forumComment)
      .where(
        and(eq(forumComment.postId, thread.id), eq(forumComment.userId, accounts.member.userId)),
      )
      .orderBy(desc(forumComment.createdAt))
      .limit(1);
    expect(comments[0].content).toBe(`UI-27P comment body ${RUN_ID}`);
    // The public thread view counts published replies.
    const refreshed = await db
      .select({ replyCount: forumPost.replyCount, lastReplyAt: forumPost.lastReplyAt })
      .from(forumPost)
      .where(eq(forumPost.id, thread.id));
    expect(refreshed[0].replyCount).toBeGreaterThan(0);
    expect(refreshed[0].lastReplyAt).not.toBeNull();
  });

  test("comments are not allowed on non-published posts", async () => {
    const pending = await db
      .select()
      .from(forumPost)
      .where(
        and(eq(forumPost.userId, accounts.member.userId), eq(forumPost.status, "PENDING_REVIEW")),
      )
      .orderBy(desc(forumPost.createdAt))
      .limit(1);

    const res = await callRoute(
      fixtures.request(`${API}/posts/${pending[0].id}/comments`, {
        cookie: accounts.member.cookie,
        body: { content: `UI-27P comment on pending ${RUN_ID}` },
      }),
      createCommentRoute,
      pending[0].id,
    );
    expect(res.status).toBe(400);
  });

  test("member files a report through POST /api/v1/forums/reports (reason required)", async () => {
    const target = await latestPostBy(accounts.admin.userId);

    const missingReason = await callRoute(
      fixtures.request(`${API}/reports`, {
        cookie: accounts.member.cookie,
        body: { targetType: "POST", postId: target.id },
      }),
      createReportRoute,
    );
    expect(missingReason.status).toBe(422);

    const res = await callRoute(
      fixtures.request(`${API}/reports`, {
        cookie: accounts.member.cookie,
        body: {
          targetType: "POST",
          postId: target.id,
          reason: `UI-27P report reason ${RUN_ID}`,
        },
      }),
      createReportRoute,
    );
    expect(res.status).toBe(201);

    const [report] = await db
      .select()
      .from(forumReport)
      .where(eq(forumReport.reportedById, accounts.member.userId))
      .orderBy(desc(forumReport.createdAt))
      .limit(1);
    expect(report.postId).toBe(target.id);
    expect(report.reason).toBe(`UI-27P report reason ${RUN_ID}`);
    expect(report.status).toBe("PENDING");
  });

  test("anonymous report attempts are rejected with 401", async () => {
    const target = await latestPostBy(accounts.admin.userId);
    const res = await callRoute(
      fixtures.request(`${API}/reports`, {
        body: { targetType: "POST", postId: target.id, reason: "Anonymous report." },
      }),
      createReportRoute,
    );
    expect(res.status).toBe(401);
  });

  test("admin moderation endpoints stay closed to members", async () => {
    const memberPost = await latestPostBy(accounts.member.userId);

    // Report inbox is moderator-only.
    const inbox = await callRoute(
      fixtures.request(`${API}/reports`, { cookie: accounts.member.cookie }),
      listReportsRoute,
    );
    expect(inbox.status).toBe(403);

    // Moderation actions are moderator-only: the member's pending post must
    // remain in the queue (the read path must never expose it).
    const moderate = await callRoute(
      fixtures.request(`${API}/moderation/posts/${memberPost.id}`, {
        cookie: accounts.member.cookie,
        body: { action: "approve" },
      }),
      moderatePostRoute,
      memberPost.id,
    );
    expect(moderate.status).toBe(403);

    const stillPending = await db
      .select({ status: forumPost.status })
      .from(forumPost)
      .where(eq(forumPost.id, memberPost.id));
    expect(stillPending[0].status).toBe("PENDING_REVIEW");

    // Category creation is admin-only.
    const category = await callRoute(
      fixtures.request(`${API}/categories`, {
        cookie: accounts.member.cookie,
        body: { name: `ui27-rogue-${RUN_ID}` },
      }),
      createCategoryRoute,
    );
    expect(category.status).toBe(403);
  });

  test("KNOWN DIVERGENCE: forum success bodies are {} because routes double-wrap the envelope", async () => {
    // src/app/api/v1/forums/** wraps an already-built Response with
    // successResponse(): NextResponse.json(successResponse(...)) serializes a
    // Response object to {}. The UI therefore relies on status codes +
    // router.refresh(), and this test pins the divergence so a future fix is
    // detected.
    const res = await callRoute(
      fixtures.request(`${API}/posts`, {
        cookie: accounts.member.cookie,
        body: {
          categoryId: openCategory.id,
          title: `UI-27P envelope probe ${RUN_ID}`,
          content: `Probing the success envelope (${RUN_ID}).`,
        },
      }),
      createPostRoute,
    );
    expect(res.status).toBe(201);
    const raw = await res.text();
    expect(raw).toBe("{}");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.data).toBeUndefined();
    expect(parsed.success).toBeUndefined();
  });

  test("members lack forum:moderate so the UI shows the awaiting-review message honestly", () => {
    // The create-post form derives its success message from the session role:
    // members without forum:moderate see "awaiting review", moderators see
    // "published". This mirrors createPost()'s actual status logic.
    expect(ROLE_PERMISSIONS.member).not.toContain("forum:moderate");
    expect(ROLE_PERMISSIONS.moderator).toContain("forum:moderate");
    expect(ROLE_PERMISSIONS.moderator).not.toContain("forum:create");
  });
});
