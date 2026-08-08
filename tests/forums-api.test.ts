/**
 * Forums API (B5) — service-level coverage for categories, posts,
 * comments, moderation queue, reports, and the per-category
 * requiredRole gate.
 *
 * Route-level permission checks are enforced by requirePermission()
 * (covered by the auth/rbac suites); here the actors carry the same
 * permission sets the routes would resolve for their roles, so the
 * service sees exactly what production hands it.
 *
 * Rows are id-isolated with unique suffixes and cleaned up in
 * afterEach (FK-safe order: reports -> comments -> posts ->
 * categories -> users) because the test DB is shared.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { forumCategory, forumComment, forumPost, forumReport, user } from "@/db/schema";
import {
  ForumServiceError,
  createCategorySchema,
  createReportSchema,
  moderatePostSchema,
  type CategoryDto,
  type CommentDto,
  type ForumActor,
  type PostDto,
  type ReportDto,
  createCategory,
  createComment,
  createPost,
  createReport,
  deleteCategory,
  deleteComment,
  deletePost,
  getCategory,
  getComment,
  getModerationQueue,
  getPost,
  listCategories,
  listComments,
  listPosts,
  listReports,
  moderatePost,
  resolveReport,
  updateCategory,
  updatePost,
} from "@/lib/services/forum.service";
import { ROLE_PERMISSIONS, isPredefinedRole } from "@/types/role.types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const createdUserIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdPostIds: string[] = [];
const createdCommentIds: string[] = [];
const createdReportIds: string[] = [];

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createActor(role: string): Promise<ForumActor> {
  const suffix = uniqueSuffix();
  const [row] = await db
    .insert(user)
    .values({
      username: `forums-${role}-${suffix}`,
      email: `forums-${role}-${suffix}@example.test`,
      name: `Forums ${role} test`,
      role,
      emailVerified: false,
    })
    .returning({ id: user.id });

  createdUserIds.push(row.id);
  const permissions = isPredefinedRole(role) ? ROLE_PERMISSIONS[role] : [];
  return { id: row.id, role, permissions };
}

async function createTestCategory(
  admin: ForumActor,
  overrides: Partial<Parameters<typeof createCategory>[0]> = {},
): Promise<CategoryDto> {
  const category = await createCategory(
    {
      name: `Forums Test Category ${uniqueSuffix()}`,
      description: "Temporary category for forums API tests",
      ...overrides,
    },
    admin,
  );
  createdCategoryIds.push(category.id);
  return category;
}

async function createTestPost(
  actor: ForumActor,
  categoryId: string,
  overrides: Partial<Parameters<typeof createPost>[0]> = {},
): Promise<PostDto> {
  const post = await createPost(
    {
      categoryId,
      title: `Forums test post ${uniqueSuffix()}`,
      content: "Body of a temporary forums test post.",
      ...overrides,
    },
    actor,
  );
  createdPostIds.push(post.id);
  return post;
}

async function createTestComment(
  actor: ForumActor,
  postId: string,
  overrides: Partial<Parameters<typeof createComment>[1]> = {},
): Promise<CommentDto> {
  const comment = await createComment(
    postId,
    {
      content: `Temporary forums test comment ${uniqueSuffix()}`,
      ...overrides,
    },
    actor,
  );
  createdCommentIds.push(comment.id);
  return comment;
}

async function createTestReport(
  actor: ForumActor,
  input: Parameters<typeof createReport>[0],
): Promise<ReportDto> {
  const report = await createReport(input, actor);
  createdReportIds.push(report.id);
  return report;
}

afterEach(async () => {
  if (createdReportIds.length > 0) {
    await db.delete(forumReport).where(inArray(forumReport.id, createdReportIds));
    createdReportIds.length = 0;
  }
  if (createdCommentIds.length > 0) {
    await db.delete(forumComment).where(inArray(forumComment.id, createdCommentIds));
    createdCommentIds.length = 0;
  }
  if (createdPostIds.length > 0) {
    await db.delete(forumPost).where(inArray(forumPost.id, createdPostIds));
    createdPostIds.length = 0;
  }
  if (createdCategoryIds.length > 0) {
    await db.delete(forumCategory).where(inArray(forumCategory.id, createdCategoryIds));
    createdCategoryIds.length = 0;
  }
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  }
});

async function expectForumProblem(promise: Promise<unknown>, status: number): Promise<void> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ForumServiceError);
    expect((error as ForumServiceError).problem.status).toBe(status);
    return;
  }
  throw new Error(`Expected ForumServiceError with status ${status}, but the call succeeded`);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

describe("forum categories", () => {
  test("create, read, list, update", async () => {
    const admin = await createActor("admin");

    const created = await createTestCategory(admin, {
      name: "Watercooler Lounge 42x",
      icon: "MessageSquare",
      color: "#3b82f6",
    });
    expect(created.displayName).toBe("Watercooler Lounge 42x");
    expect(created.name).toBe("watercooler-lounge-42x"); // slug derived from display name
    expect(created.postCount).toBe(0);
    expect(created.lastPostAt).toBeNull();

    const fetched = await getCategory(created.id);
    expect(fetched.id).toBe(created.id);

    const list = await listCategories();
    expect(list.some((entry) => entry.id === created.id)).toBe(true);

    const updated = await updateCategory(
      created.id,
      { name: "Watercooler Lounge Renamed", color: "#ef4444" },
      admin,
    );
    expect(updated.displayName).toBe("Watercooler Lounge Renamed");
    expect(updated.color).toBe("#ef4444");
    // Slug untouched unless explicitly changed.
    expect(updated.name).toBe("watercooler-lounge-42x");
  });

  test("duplicate slug is rejected", async () => {
    const admin = await createActor("admin");
    const suffix = uniqueSuffix();

    await createTestCategory(admin, { slug: `dup-slug-${suffix}` });
    await expectForumProblem(
      createCategory({ name: "Another Category", slug: `dup-slug-${suffix}` }, admin),
      409,
    );
  });

  test("unknown requiredRole is rejected by the schema", () => {
    const parsed = createCategorySchema.safeParse({
      name: "Gated",
      requiredRole: "definitely-not-a-role",
    });
    expect(parsed.success).toBe(false);
  });

  test("delete is blocked while posts exist, succeeds once empty", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    await expectForumProblem(deleteCategory(category.id, admin), 409);

    // Soft delete still leaves a row behind; only an empty category goes.
    await db.delete(forumPost).where(eq(forumPost.id, post.id));
    await deleteCategory(category.id, admin);
    await expectForumProblem(getCategory(category.id), 404);
  });

  test("missing category is a 404", async () => {
    const admin = await createActor("admin");
    await expectForumProblem(getCategory(`missing-${uniqueSuffix()}`), 404);
    await expectForumProblem(deleteCategory(`missing-${uniqueSuffix()}`, admin), 404);
  });
});

// ---------------------------------------------------------------------------
// requiredRole gate
// ---------------------------------------------------------------------------

describe("per-category requiredRole gate", () => {
  test("member below the gate cannot post; committee_chair and admin can", async () => {
    const admin = await createActor("admin");
    const chair = await createActor("committee_chair"); // level 60, no forum:moderate
    const member = await createActor("member");

    const gated = await createTestCategory(admin, {
      requiredRole: "moderator",
    }); // level 50

    await expectForumProblem(
      createPost(
        {
          categoryId: gated.id,
          title: "Blocked post",
          content: "Should not pass the gate.",
        },
        member,
      ),
      403,
    );

    // committee_chair clears the gate but does not hold forum:moderate,
    // so the post lands in the moderation queue.
    const chairPost = await createTestPost(chair, gated.id);
    expect(chairPost.status).toBe("PENDING_REVIEW");

    // admin clears the gate AND moderates, so the post publishes directly.
    const adminPost = await createTestPost(admin, gated.id);
    expect(adminPost.status).toBe("PUBLISHED");
  });

  test("the gate also covers comment creation (via the post's category)", async () => {
    const admin = await createActor("admin");
    const staff = await createActor("staff");
    const member = await createActor("member");

    const gated = await createTestCategory(admin, { requiredRole: "staff" });
    const post = await createTestPost(admin, gated.id);

    await expectForumProblem(createComment(post.id, { content: "Blocked comment" }, member), 403);

    const comment = await createTestComment(staff, post.id);
    expect(comment.status).toBe("PUBLISHED");
  });

  test("a role at exactly the required level passes", async () => {
    const admin = await createActor("admin");
    const moderator = await createActor("moderator");

    const gated = await createTestCategory(admin, {
      requiredRole: "moderator",
    });
    const post = await createTestPost(moderator, gated.id);
    expect(post.status).toBe("PUBLISHED"); // moderator holds forum:moderate
  });

  test("custom roles sit at level 0 and fail any predefined gate", async () => {
    const admin = await createActor("admin");
    const custom = await createActor(`custom_forum_role_${uniqueSuffix()}`);

    const gated = await createTestCategory(admin, { requiredRole: "member" });
    await expectForumProblem(
      createPost(
        {
          categoryId: gated.id,
          title: "Custom role post",
          content: "Gate should block.",
        },
        custom,
      ),
      403,
    );

    // Ungated category stays open to everyone.
    const open = await createTestCategory(admin);
    const post = await createTestPost(custom, open.id);
    expect(post.status).toBe("PENDING_REVIEW");
  });

  test("moving a post re-runs the destination category gate", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const open = await createTestCategory(admin);
    const gated = await createTestCategory(admin, { requiredRole: "staff" });
    const post = await createTestPost(member, open.id);

    // Member tries to move their post into the gated category.
    await expectForumProblem(updatePost(post.id, { categoryId: gated.id }, member), 403);

    // Admin can move it.
    const moved = await updatePost(post.id, { categoryId: gated.id }, admin);
    expect(moved.categoryId).toBe(gated.id);
  });
});

// ---------------------------------------------------------------------------
// Moderation flow
// ---------------------------------------------------------------------------

describe("moderation queue", () => {
  test("member posts queue as PENDING_REVIEW, approval publishes", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id);
    expect(post.status).toBe("PENDING_REVIEW");
    expect(post.author.id).toBe(member.id);

    const queue = await getModerationQueue();
    const entry = queue.find((row) => row.id === post.id);
    expect(entry).toBeDefined();
    expect(entry?.category.id).toBe(category.id);
    expect(entry?.reportCount).toBe(0);

    const approved = await moderatePost(post.id, { action: "approve" }, moderator);
    expect(approved.status).toBe("PUBLISHED");

    const queueAfter = await getModerationQueue();
    expect(queueAfter.some((row) => row.id === post.id)).toBe(false);
  });

  test("explicit PUBLISHED from a non-moderator is forced to PENDING_REVIEW", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id, {
      status: "PUBLISHED",
    });
    expect(post.status).toBe("PENDING_REVIEW");

    // Drafts stay drafts even for members.
    const draft = await createTestPost(member, category.id, {
      status: "DRAFT",
    });
    expect(draft.status).toBe("DRAFT");
  });

  test("reject hides the post and records the moderation metadata", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id);

    const rejected = await moderatePost(
      post.id,
      { action: "reject", reason: "Spam or promotional content" },
      moderator,
    );
    expect(rejected.status).toBe("HIDDEN");

    const [row] = await db
      .select({ metadata: forumPost.metadata })
      .from(forumPost)
      .where(eq(forumPost.id, post.id));
    const moderation = (row.metadata as Record<string, unknown> | null)?.moderation as Record<
      string,
      unknown
    >;
    expect(moderation.action).toBe("reject");
    expect(moderation.reason).toBe("Spam or promotional content");
    expect(moderation.by).toBe(moderator.id);
  });

  test("reject requires a reason", () => {
    const parsed = moderatePostSchema.safeParse({ action: "reject" });
    expect(parsed.success).toBe(false);
    const withReason = moderatePostSchema.safeParse({
      action: "reject",
      reason: "Off-topic",
    });
    expect(withReason.success).toBe(true);
  });

  test("actors with forum:moderate publish directly", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);

    const post = await createTestPost(admin, category.id);
    expect(post.status).toBe("PUBLISHED");
  });
});

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

describe("forum posts", () => {
  test("list filters by status and paginates", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    await createTestPost(admin, category.id);
    await createTestPost(admin, category.id);

    const page = await listPosts({
      categoryId: category.id,
      page: 1,
      limit: 1,
    });
    expect(page.total).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.items).toHaveLength(1);

    const all = await listPosts({
      categoryId: category.id,
      page: 1,
      limit: 20,
    });
    expect(all.items).toHaveLength(2);

    const hidden = await listPosts({
      categoryId: category.id,
      status: "HIDDEN",
      page: 1,
      limit: 20,
    });
    expect(hidden.items).toHaveLength(0);
  });

  test("update edits fields; delete is a soft delete", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    const updated = await updatePost(
      post.id,
      { title: "Edited title", status: "ARCHIVED", isLocked: true },
      admin,
    );
    expect(updated.title).toBe("Edited title");
    expect(updated.status).toBe("ARCHIVED");
    expect(updated.isLocked).toBe(true);

    await deletePost(post.id, admin);
    const deleted = await getPost(post.id);
    expect(deleted.status).toBe("DELETED");

    await expectForumProblem(getPost(`missing-${uniqueSuffix()}`), 404);
  });
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

describe("forum comments", () => {
  test("create bumps replyCount and lastReplyAt; list returns them", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    expect(post.replyCount).toBe(0);
    expect(post.lastReplyAt).toBeNull();

    const comment = await createTestComment(member, post.id);
    expect(comment.author.id).toBe(member.id);
    expect(comment.status).toBe("PUBLISHED");

    const reloaded = await getPost(post.id);
    expect(reloaded.replyCount).toBe(1);
    expect(reloaded.lastReplyAt).not.toBeNull();

    const comments = await listComments(post.id);
    expect(comments.some((row) => row.id === comment.id)).toBe(true);

    const single = await getComment(comment.id);
    expect(single.postId).toBe(post.id);
  });

  test("locked posts refuse new comments", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    await updatePost(post.id, { isLocked: true }, admin);

    await expectForumProblem(createComment(post.id, { content: "Should be blocked" }, member), 409);
  });

  test("non-moderators cannot comment on unpublished posts", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const pending = await createTestPost(member, category.id); // PENDING_REVIEW

    await expectForumProblem(createComment(pending.id, { content: "Too early" }, member), 400);
  });

  test("parent comment must belong to the same post", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const postA = await createTestPost(admin, category.id);
    const postB = await createTestPost(admin, category.id);
    const parentOnB = await createTestComment(admin, postB.id);

    await expectForumProblem(
      createComment(postA.id, { content: "Wrong parent", parentId: parentOnB.id }, member),
      400,
    );

    const reply = await createTestComment(member, postB.id, {
      parentId: parentOnB.id,
    });
    expect(reply.parentId).toBe(parentOnB.id);
  });

  test("delete soft-deletes and decrements replyCount", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const comment = await createTestComment(member, post.id);

    await deleteComment(comment.id, admin);
    const reloadedComment = await getComment(comment.id);
    expect(reloadedComment.status).toBe("DELETED");

    const reloadedPost = await getPost(post.id);
    expect(reloadedPost.replyCount).toBe(0);

    await expectForumProblem(deleteComment(`missing-${uniqueSuffix()}`, admin), 404);
  });
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

describe("forum reports", () => {
  test("report a post: created PENDING with a target snapshot", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    const report = await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Spam",
    });
    expect(report.status).toBe("PENDING");
    expect(report.targetId).toBe(post.id);
    expect(report.reportedBy.id).toBe(member.id);
    expect(report.targetContent?.title).toBe(post.title);

    const list = await listReports();
    expect(list.some((row) => row.id === report.id)).toBe(true);

    const pendingOnly = await listReports("PENDING");
    expect(pendingOnly.some((row) => row.id === report.id)).toBe(true);
    const resolvedOnly = await listReports("RESOLVED");
    expect(resolvedOnly.some((row) => row.id === report.id)).toBe(false);
  });

  test("report a comment", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const comment = await createTestComment(admin, post.id);

    const report = await createTestReport(member, {
      targetType: "COMMENT",
      commentId: comment.id,
      reason: "Harassment",
    });
    expect(report.targetId).toBe(comment.id);
    expect(report.targetContent?.content).toContain(comment.content.slice(0, 20));
  });

  test("schema enforces exactly one matching target id", () => {
    const both = createReportSchema.safeParse({
      targetType: "POST",
      postId: "p1",
      commentId: "c1",
      reason: "x",
    });
    expect(both.success).toBe(false);

    const mismatch = createReportSchema.safeParse({
      targetType: "COMMENT",
      postId: "p1",
      reason: "x",
    });
    expect(mismatch.success).toBe(false);
  });

  test("reporting a missing target is a 404", async () => {
    const member = await createActor("member");
    await expectForumProblem(
      createReport(
        {
          targetType: "POST",
          postId: `missing-${uniqueSuffix()}`,
          reason: "Ghost",
        },
        member,
      ),
      404,
    );
  });

  test("resolve closes the report; double resolve conflicts", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const report = await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Off-topic",
    });

    const resolved = await resolveReport(report.id, { action: "RESOLVED" }, moderator);
    expect(resolved.status).toBe("RESOLVED");

    await expectForumProblem(resolveReport(report.id, { action: "DISMISSED" }, moderator), 409);
  });

  test("resolve with deleteContent soft-deletes the target", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const report = await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Abuse",
    });

    await resolveReport(report.id, { action: "RESOLVED", deleteContent: true }, moderator);
    const reloaded = await getPost(post.id);
    expect(reloaded.status).toBe("DELETED");
  });

  test("queue entries carry pending report counts", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id); // PENDING_REVIEW

    await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Spam",
    });
    await createTestReport(admin, {
      targetType: "POST",
      postId: post.id,
      reason: "Duplicate",
    });

    const queue = await getModerationQueue();
    const entry = queue.find((row) => row.id === post.id);
    expect(entry?.reportCount).toBe(2);

    // Approving the post does not resolve its reports.
    await moderatePost(post.id, { action: "approve" }, moderator);
    const reports = await listReports("PENDING");
    expect(reports.filter((row) => row.targetId === post.id)).toHaveLength(2);
  });
});
