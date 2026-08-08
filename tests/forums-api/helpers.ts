/**
 * Shared fixtures for the forums API suite (tests/forums-api/).
 *
 * Route-level permission checks are enforced by requirePermission()
 * (covered by the auth/rbac suites); here the actors carry the same
 * permission sets the routes would resolve for their roles, so the
 * service sees exactly what production hands it.
 *
 * Rows are id-isolated with unique suffixes and cleaned up by the
 * afterEach hook that registerCleanup() installs (FK-safe order:
 * reports -> comments -> posts -> categories -> users) because the
 * test DB is shared.
 */
import { afterEach, expect } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { forumCategory, forumComment, forumPost, forumReport, user } from "@/db/schema";
import {
  ForumServiceError,
  createCategory,
  createComment,
  createPost,
  createReport,
  type CategoryDto,
  type CommentDto,
  type ForumActor,
  type PostDto,
  type ReportDto,
} from "@/lib/services/forum";
import { ROLE_PERMISSIONS, isPredefinedRole } from "@/types/role";

const createdUserIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdPostIds: string[] = [];
const createdCommentIds: string[] = [];
const createdReportIds: string[] = [];

export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createActor(role: string): Promise<ForumActor> {
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

export async function createTestCategory(
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

export async function createTestPost(
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

export async function createTestComment(
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

export async function createTestReport(
  actor: ForumActor,
  input: Parameters<typeof createReport>[0],
): Promise<ReportDto> {
  const report = await createReport(input, actor);
  createdReportIds.push(report.id);
  return report;
}

/**
 * Installs the per-file afterEach cleanup. Each test part calls this once at
 * module scope so its own hook registration drains the fixture rows, even
 * though bun shares one module cache across every test file in a run.
 */
export function registerCleanup(): void {
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
}

export async function expectForumProblem(promise: Promise<unknown>, status: number): Promise<void> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ForumServiceError);
    expect((error as ForumServiceError).problem.status).toBe(status);
    return;
  }
  throw new Error(`Expected ForumServiceError with status ${status}, but the call succeeded`);
}
