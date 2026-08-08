/**
 * Content API (B4) — service-level CRUD round-trips for articles,
 * publications, announcements, and categories.
 *
 * Route-level permission checks are enforced by requirePermission()
 * (covered by the auth/rbac suites); here we exercise the same service
 * the routes delegate to, including UI-field round-trips through
 * content.metadata.ui, slug collision handling, and category
 * content counts.
 *
 * Rows are id-isolated with unique suffixes and cleaned up in
 * afterEach (FK-safe order: content -> content_categories, then users
 * in afterAll) because the test DB is shared.
 */
import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { content, contentCategory, user } from "@/db/schema";
import {
  ContentApiError,
  createCategoryItem,
  createContentItem,
  deleteCategoryItem,
  deleteContentItem,
  getCategoryItem,
  getContentItem,
  listCategories,
  listContent,
  updateCategoryItem,
  updateContentItem,
  type ContentCollection,
} from "@/lib/services/content";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const createdContentIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdUserIds: string[] = [];

let actorId = "";

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function expectApiError(
  action: () => Promise<unknown>,
  status: number,
  slug: string,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    expect(error).toBeInstanceOf(ContentApiError);
    expect((error as ContentApiError).status).toBe(status);
    expect((error as ContentApiError).slug).toBe(slug);
    return;
  }
  throw new Error(`Expected ContentApiError ${status}/${slug}, but no error was thrown`);
}

async function trackCreate(
  collection: ContentCollection,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const item = await createContentItem(
    collection,
    input as Parameters<typeof createContentItem>[1],
    actorId,
  );
  createdContentIds.push(item.id as string);
  return item;
}

async function makeCategory(suffix: string, type: string): Promise<Record<string, unknown>> {
  const category = await createCategoryItem(
    {
      name: `Content Cat ${suffix}`,
      description: "Test category for content API tests",
      type,
      scope: "global",
      status: "active",
      color: "#123456",
      emoji: "🧪",
      order: 1,
      allowedRoles: ["admin"],
    },
    actorId,
  );
  createdCategoryIds.push(category.id);
  return category as unknown as Record<string, unknown>;
}

beforeAll(async () => {
  const suffix = uniqueSuffix();
  const [row] = await db
    .insert(user)
    .values({
      username: `content-actor-${suffix}`,
      email: `content-actor-${suffix}@example.test`,
      name: "Content Test Actor",
      role: "content_manager",
      emailVerified: false,
    })
    .returning({ id: user.id });
  actorId = row.id;
  createdUserIds.push(actorId);
});

afterEach(async () => {
  if (createdContentIds.length > 0) {
    await db.delete(content).where(inArray(content.id, createdContentIds));
    createdContentIds.length = 0;
  }
  if (createdCategoryIds.length > 0) {
    await db.delete(contentCategory).where(inArray(contentCategory.id, createdCategoryIds));
    createdCategoryIds.length = 0;
  }
});

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  }
});

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

describe("articles round-trip", () => {
  test("create, read, update, list, and delete an article", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    const article = await trackCreate("articles", {
      title: `Test Article ${suffix}`,
      excerpt: "An excerpt for the test article",
      content: "The body of the test article with enough words to count properly.",
      type: "tutorial",
      category: category.name,
      status: "draft",
      visibility: "members_only",
      tagIds: ["testing", "content"],
      authorId: actorId,
    });

    expect(article.id).toBeTruthy();
    expect(article.title).toBe(`Test Article ${suffix}`);
    expect(article.status).toBe("draft");
    // UI-only visibility survives the DB mapping via metadata.ui.
    expect(article.visibility).toBe("members_only");
    expect(article.type).toBe("tutorial");
    expect(article.category).toBe(category.name);
    expect((article.author as { id: string }).id).toBe(actorId);
    expect(article.tags).toHaveLength(2);
    expect((article.wordCount as number) ?? 0).toBeGreaterThan(0);
    expect((article.readTime as number) ?? 0).toBeGreaterThanOrEqual(1);

    const fetched = await getContentItem("articles", article.id as string);
    expect(fetched.title).toBe(`Test Article ${suffix}`);
    expect(fetched.visibility).toBe("members_only");

    const updated = await updateContentItem(
      "articles",
      article.id as string,
      { title: `Renamed Article ${suffix}`, status: "published", excerpt: "Updated excerpt" },
      actorId,
    );
    expect(updated.title).toBe(`Renamed Article ${suffix}`);
    expect(updated.status).toBe("published");
    expect(updated.publishedAt).toBeTruthy();

    const listed = await listContent("articles", {
      page: 1,
      limit: 10,
      search: `Renamed Article ${suffix}`,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(listed.items.some((item) => item.id === article.id)).toBe(true);

    await deleteContentItem("articles", article.id as string);
    await expectApiError(() => getContentItem("articles", article.id as string), 404, "not-found");
  });

  test("articles are isolated from other collections", async () => {
    const suffix = uniqueSuffix();
    const article = await trackCreate("articles", {
      title: `Isolation Article ${suffix}`,
      content: "Body",
    });
    const publication = await trackCreate("publications", {
      title: `Isolation Publication ${suffix}`,
      content: "Body",
    });

    const publications = await listContent("publications", {
      page: 1,
      limit: 100,
      search: suffix,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const ids = publications.items.map((item) => item.id);
    expect(ids).toContain(publication.id);
    expect(ids).not.toContain(article.id);

    // Cross-collection lookups miss: the item exists but under another type.
    await expectApiError(
      () => getContentItem("publications", article.id as string),
      404,
      "not-found",
    );
  });

  test("explicit slug collisions surface a conflict, derived slugs retry", async () => {
    const suffix = uniqueSuffix();
    const slug = `explicit-content-slug-${suffix}`;

    await trackCreate("articles", {
      title: `Slug First ${suffix}`,
      content: "Body",
      slug,
    });
    await expectApiError(
      () => trackCreate("articles", { title: `Slug Second ${suffix}`, content: "Body", slug }),
      409,
      "conflict",
    );

    // Same title without an explicit slug: the second insert derives a
    // suffixed slug instead of failing.
    const first = await trackCreate("articles", {
      title: `Derived Slug ${suffix}`,
      content: "Body",
    });
    const second = await trackCreate("articles", {
      title: `Derived Slug ${suffix}`,
      content: "Body",
    });
    expect(first.slug).not.toBe(second.slug);
  });

  test("list pagination returns page metadata", async () => {
    const suffix = uniqueSuffix();
    const batch = `Page-${suffix}`;
    for (let index = 0; index < 3; index += 1) {
      await trackCreate("articles", {
        title: `${batch} Item ${index}`,
        content: "Body",
      });
    }

    const page = await listContent("articles", {
      page: 1,
      limit: 2,
      search: batch,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(page.items.length).toBeLessThanOrEqual(2);
    expect(page.total).toBeGreaterThanOrEqual(3);
    expect(page.totalPages).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------

describe("publications round-trip", () => {
  test("create and update a publication with UI round-trip fields", async () => {
    const suffix = uniqueSuffix();

    const publication = await trackCreate("publications", {
      title: `Whitepaper ${suffix}`,
      excerpt: "A publication excerpt",
      content: "Publication body text with enough words to measure reading time.",
      type: "whitepaper",
      status: "published",
      visibility: "premium_only",
      downloadEnabled: true,
      isFeatured: true,
      priority: 10,
      seo: { title: `SEO ${suffix}`, description: "SEO description", keywords: ["seo"] },
      authorId: actorId,
    });

    expect(publication.type).toBe("whitepaper");
    expect(publication.status).toBe("published");
    expect(publication.visibility).toBe("premium_only");
    expect(publication.downloadEnabled).toBe(true);
    expect(publication.isFeatured).toBe(true);
    expect(publication.priority).toBe(10);
    expect((publication.seo as { title: string }).title).toBe(`SEO ${suffix}`);
    expect(publication.publishedAt).toBeTruthy();

    const updated = await updateContentItem(
      "publications",
      publication.id as string,
      { status: "archived", downloadEnabled: false },
      actorId,
    );
    expect(updated.status).toBe("archived");
    expect(updated.downloadEnabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

describe("announcements round-trip", () => {
  test("create an announcement with announcement-specific fields", async () => {
    const suffix = uniqueSuffix();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const announcement = await trackCreate("announcements", {
      title: `Maintenance Notice ${suffix}`,
      excerpt: "Scheduled maintenance window",
      content: "The platform will be unavailable during the maintenance window.",
      type: "maintenance",
      status: "published",
      targetAudience: "specific_chapters",
      targetChapters: ["chapter_north"],
      expiresAt,
      isUrgent: true,
      isPinned: true,
      requiresAcknowledgment: true,
      sendEmailNotification: true,
      displayInDashboard: true,
      authorId: actorId,
    });

    expect(announcement.type).toBe("maintenance");
    expect(announcement.targetAudience).toBe("specific_chapters");
    expect(announcement.targetChapters).toEqual(["chapter_north"]);
    expect(announcement.expiresAt).toBeTruthy();
    expect(announcement.isUrgent).toBe(true);
    expect(announcement.isPinned).toBe(true);
    expect(announcement.requiresAcknowledgment).toBe(true);
    expect(announcement.sendEmailNotification).toBe(true);
    expect(announcement.displayInDashboard).toBe(true);
    expect(announcement.acknowledgmentCount).toBe(0);

    const updated = await updateContentItem(
      "announcements",
      announcement.id as string,
      { isUrgent: false, acknowledgmentCount: 5 },
      actorId,
    );
    expect(updated.isUrgent).toBe(false);
    expect(updated.acknowledgmentCount).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

describe("categories round-trip", () => {
  test("create, update, count content, and delete a category", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "publication");

    expect(category.name).toBe(`Content Cat ${suffix}`);
    expect(category.contentCount).toBe(0);
    expect(category.status).toBe("active");
    expect(category.scope).toBe("global");
    expect(category.emoji).toBe("🧪");
    expect(category.allowedRoles).toEqual(["admin"]);

    const updated = await updateCategoryItem(
      category.id as string,
      { status: "archived", emoji: "🎉", order: 5 },
      actorId,
    );
    expect(updated.status).toBe("archived");
    expect(updated.emoji).toBe("🎉");
    expect(updated.order).toBe(5);

    const fetched = await getCategoryItem(category.id as string);
    expect(fetched.name).toBe(`Content Cat ${suffix}`);

    const listed = await listCategories({
      page: 1,
      limit: 100,
      search: `Content Cat ${suffix}`,
    });
    expect(listed.items.some((item) => item.id === category.id)).toBe(true);

    // Content referencing the category increments its count and blocks delete.
    const article = await trackCreate("articles", {
      title: `Categorized ${suffix}`,
      content: "Body",
      category: category.name as string,
    });
    const withContent = await getCategoryItem(category.id as string);
    expect(withContent.contentCount).toBe(1);

    await expectApiError(() => deleteCategoryItem(category.id as string), 409, "conflict");

    await deleteContentItem("articles", article.id as string);
    await deleteCategoryItem(category.id as string);
    createdCategoryIds.splice(createdCategoryIds.indexOf(category.id as string), 1);
    await expectApiError(() => getCategoryItem(category.id as string), 404, "not-found");
  });
});
